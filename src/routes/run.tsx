import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flag, Pause, Play, Radio, Square, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TraceMap } from "@/components/map/trace-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { pathDistance, pointAlongPath } from "@/lib/geo";
import { publishLive } from "@/lib/live";
import { alertTone, ensureNotificationPermission, notify, pulseDevice } from "@/lib/notifications";
import { evaluatePace, paceFrom, targetDurationSec } from "@/lib/pace";
import { liveCode } from "@/lib/share";
import { useTraceStore } from "@/lib/store";
import type { LatLng, PaceStatus, RouteDraft } from "@/lib/types";
import { formatClock, formatKm, formatPace, uid } from "@/lib/utils";

type Search = { routeId?: string };

export const Route = createFileRoute("/run")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    routeId: typeof raw.routeId === "string" ? raw.routeId : undefined,
  }),
  component: RunPage,
});

function RunPage() {
  const { routeId } = Route.useSearch();
  const navigate = useNavigate();
  const routes = useTraceStore((s) => s.routes);
  const logActivity = useTraceStore((s) => s.logActivity);
  const addSteps = useTraceStore((s) => s.addSteps);
  const notificationsOn = useTraceStore((s) => s.notificationsOn);
  const setNotificationsOn = useTraceStore((s) => s.setNotificationsOn);
  const setLiveCode = useTraceStore((s) => s.setLiveCode);
  const storedLive = useTraceStore((s) => s.liveCode);

  const [selectedId, setSelectedId] = useState(routeId ?? routes[0]?.id);
  const route: RouteDraft | undefined = routes.find((r) => r.id === selectedId) ?? routes[0];

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [covered, setCovered] = useState(0);
  const [you, setYou] = useState<LatLng | null>(route?.points[0] ?? null);
  const [track, setTrack] = useState<LatLng[]>([]);
  const [demo, setDemo] = useState(true);
  const [effort, setEffort] = useState(0.82);
  const [liveOn, setLiveOn] = useState(Boolean(storedLive));
  const [code, setCode] = useState(storedLive ?? liveCode());
  const [finished, setFinished] = useState(false);
  const lastAlert = useRef(0);
  const lastStatus = useRef<PaceStatus>("warmup");
  const watchRef = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const accum = useRef(0);
  const lastTick = useRef<number | null>(null);
  const finishing = useRef(false);
  const trackRef = useRef<LatLng[]>([]);
  const coveredRef = useRef(0);

  useEffect(() => {
    if (routeId && routeId !== selectedId) setSelectedId(routeId);
  }, [routeId, selectedId]);

  useEffect(() => {
    if (route && !running) setYou(route.points[0] ?? null);
  }, [route, running]);

  const evaln = useMemo(() => {
    if (!route) {
      return evaluatePace({
        distanceM: covered,
        elapsedSec: elapsed,
        routeDistanceM: Math.max(covered, 1),
        targetPaceMinPerKm: 5,
      });
    }
    return evaluatePace({
      distanceM: covered,
      elapsedSec: elapsed,
      routeDistanceM: route.distanceM,
      targetPaceMinPerKm: route.targetPaceMinPerKm,
    });
  }, [route, covered, elapsed]);

  const ghost = useMemo(() => {
    if (!route) return null;
    return pointAlongPath(route.points, evaln.ghostDistanceM);
  }, [route, evaln.ghostDistanceM]);

  useEffect(() => {
    if (!running || paused) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const last = lastTick.current ?? now;
      const dt = Math.min(1.2, (now - last) / 1000);
      lastTick.current = now;
      accum.current += dt;
      setElapsed(accum.current);

      if (demo && route) {
        const targetMps = 1000 / (route.targetPaceMinPerKm * 60);
        const step = targetMps * effort * dt;
        setCovered((prev) => {
          const next = Math.min(route.distanceM, prev + step);
          coveredRef.current = next;
          const pos = pointAlongPath(route.points, next);
          if (pos) {
            setYou(pos);
            setTrack((t) => {
              const nt = t.length && t[t.length - 1] === pos ? t : [...t, pos];
              trackRef.current = nt;
              return nt;
            });
          }
          if (next >= route.distanceM - 1 && !finishing.current) {
            finishing.current = true;
            const t = accum.current;
            window.setTimeout(() => finish(next, t), 0);
          }
          return next;
        });
      }
    }, 200);
    return () => window.clearInterval(id);
    // finish is stable enough via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, demo, effort, route]);

  useEffect(() => {
    if (!running || paused || demo) return;
    if (!navigator.geolocation) {
      setDemo(true);
      toast("Location unavailable. Demo GPS is on.");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setYou(p);
        setTrack((t) => {
          const next = [...t, p];
          setCovered(pathDistance(next));
          return next;
        });
      },
      () => {
        setDemo(true);
        toast("GPS denied. Switching to demo along the trace.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 },
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [running, paused, demo]);

  useEffect(() => {
    if (!running || paused) return;
    if (evaln.status === lastStatus.current) return;
    lastStatus.current = evaln.status;
    const now = Date.now();
    if (now - lastAlert.current < 12000) return;
    if (evaln.status === "behind") {
      lastAlert.current = now;
      pulseDevice();
      alertTone();
      toast.error(evaln.message);
      if (notificationsOn) notify("Increase pace", evaln.message, "pace");
    } else if (evaln.status === "ahead") {
      lastAlert.current = now;
      toast(evaln.message);
    } else if (evaln.status === "finished") {
      toast.success(evaln.message);
      if (notificationsOn) notify("Run complete", evaln.message, "finish");
    }
  }, [evaln, running, paused, notificationsOn]);

  useEffect(() => {
    if (!liveOn || !running || !you) return;
    publishLive(code, {
      v: 1,
      runner: useTraceStore.getState().displayName,
      routeName: route?.name,
      points: route?.points,
      pace: route?.targetPaceMinPerKm,
      fix: {
        lat: you.lat,
        lng: you.lng,
        at: Date.now(),
        distanceM: covered,
        elapsedSec: elapsed,
      },
    });
  }, [liveOn, running, you, code, covered, elapsed, route]);

  function finish(distance = coveredRef.current, time = accum.current) {
    if (finishing.current && finished) return;
    finishing.current = true;
    setFinished(true);
    setRunning(false);
    setPaused(false);
    const avg = paceFrom(distance, time);
    const hit =
      !!route && time <= targetDurationSec(route.distanceM, route.targetPaceMinPerKm) + 8;
    logActivity({
      id: uid("act"),
      routeId: route?.id,
      name: route?.name ?? "Free run",
      kind: "run",
      startedAt: startedAt.current ?? Date.now(),
      durationSec: Math.round(time),
      distanceM: distance,
      avgPaceMinPerKm: avg,
      targetPaceMinPerKm: route?.targetPaceMinPerKm,
      hitTarget: hit,
      points: trackRef.current.length ? trackRef.current : (route?.points ?? []),
      splits: [],
    });
    addSteps(Math.round(distance / 0.76));
    if (notificationsOn) {
      notify(
        "Run saved",
        `${formatKm(distance)} in ${formatClock(time)} · ${formatPace(avg)} /km`,
        "saved",
      );
    }
  }

  async function start() {
    if (!route) {
      toast("Trace a route first.");
      void navigate({ to: "/trace" });
      return;
    }
    const ok = await ensureNotificationPermission();
    setNotificationsOn(ok);
    startedAt.current = Date.now();
    accum.current = 0;
    lastTick.current = performance.now();
    lastStatus.current = "warmup";
    finishing.current = false;
    coveredRef.current = 0;
    setElapsed(0);
    setCovered(0);
    const startPt = route.points[0]!;
    trackRef.current = [startPt];
    setTrack([startPt]);
    setYou(startPt);
    setFinished(false);
    setPaused(false);
    setRunning(true);
    if (liveOn) setLiveCode(code);
    toast(demo ? "Demo run started — effort is under target so the coach can fire." : "GPS run started.");
  }

  function toggleLive(on: boolean) {
    setLiveOn(on);
    if (on) {
      const c = code || liveCode();
      setCode(c);
      setLiveCode(c);
      toast(`Live share code ${c}`);
    } else {
      setLiveCode(null);
    }
  }

  const statusTone =
    evaln.status === "behind" ? "warn" : evaln.status === "ahead" || evaln.status === "on_pace" ? "sage" : "default";

  if (!route) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <p className="font-display text-2xl">No traces yet</p>
        <Button asChild>
          <Link to="/trace">Draw a route</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <div className="relative h-[46vh] min-h-[240px]">
        <TraceMap
          points={route.points}
          you={you}
          ghost={ghost}
          follow={running}
          className="h-full w-full"
        />
        <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
          <Link to="/" className="rounded-md bg-bg/85 px-3 py-2 text-xs text-muted shadow-[var(--shadow-border)]">
            Close
          </Link>
          <Badge variant={statusTone === "warn" ? "warn" : statusTone === "sage" ? "sage" : "default"}>
            {evaln.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="relative -mt-6 flex-1 rounded-t-2xl bg-bg px-5 pb-8 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Pace coach</p>
            <h1 className="font-display text-xl font-semibold">{route.name}</h1>
          </div>
          <p className="text-right text-xs text-muted">
            Target {formatPace(route.targetPaceMinPerKm)} /km
            <br />
            {formatKm(route.distanceM)} · {formatClock(targetDurationSec(route.distanceM, route.targetPaceMinPerKm))}
          </p>
        </div>

        <div
          className={`mt-4 rounded-xl px-4 py-3 shadow-[var(--shadow-border)] ${
            evaln.status === "behind" ? "bg-warn/10" : "bg-surface"
          }`}
        >
          <p className="text-sm">{evaln.message}</p>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Time" value={formatClock(elapsed)} />
          <Stat label="Distance" value={formatKm(covered)} />
          <Stat label="Pace" value={formatPace(evaln.currentPace)} />
          <Stat label="Need" value={formatPace(evaln.requiredPace || route.targetPaceMinPerKm)} />
          <Stat label="Ghost" value={formatKm(evaln.ghostDistanceM)} />
          <Stat label="Left" value={formatKm(evaln.remainingM)} />
        </dl>

        {!running && !finished && (
          <div className="mt-5 space-y-3">
            {routes.length > 1 && (
              <label className="block">
                <span className="text-xs text-muted">Route</span>
                <select
                  className="mt-1 h-11 w-full rounded-md bg-surface-2 px-3 text-sm shadow-[var(--shadow-border)]"
                  value={route.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {formatKm(r.distanceM)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <div>
                <p className="text-sm font-medium">Demo GPS</p>
                <p className="text-xs text-muted">Walks the trace. Slow effort triggers alerts.</p>
              </div>
              <Switch checked={demo} onCheckedChange={setDemo} />
            </div>
            {demo && (
              <div>
                <p className="text-xs text-muted">Demo effort · {Math.round(effort * 100)}% of target</p>
                <Slider
                  className="mt-2"
                  min={0.6}
                  max={1.15}
                  step={0.01}
                  value={[effort]}
                  onValueChange={(v) => setEffort(v[0] ?? 0.82)}
                />
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <div>
                <p className="text-sm font-medium">Live location</p>
                <p className="text-xs text-muted">Code {code} · watchers open Live</p>
              </div>
              <Switch checked={liveOn} onCheckedChange={toggleLive} />
            </div>
            <Button className="h-12 w-full" onClick={() => void start()}>
              <Play className="size-4" />
              Start run
            </Button>
          </div>
        )}

        {running && (
          <div className="mt-5 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setPaused((p) => !p);
                lastTick.current = performance.now();
              }}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button variant="warn" className="flex-1" onClick={() => finish()}>
              <Square className="size-4" />
              Finish
            </Button>
          </div>
        )}

        {finished && (
          <Card className="mt-5 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-sage" />
              <p className="font-display text-lg font-semibold">Saved</p>
            </div>
            <p className="mt-2 text-sm text-muted">{evaln.message}</p>
            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setFinished(false);
                  setElapsed(0);
                  setCovered(0);
                }}
              >
                Run again
              </Button>
              <Button asChild variant="secondary" className="flex-1">
                <Link to="/">Home</Link>
              </Button>
            </div>
          </Card>
        )}

        {liveOn && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Radio className="size-3.5 text-sage" />
            Sharing live as {code}. Open Live in another tab to follow.
          </p>
        )}
        {demo && running && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted">
            <Zap className="size-3.5" />
            Demo runner is {Math.round(effort * 100)}% of target speed.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-2 py-2.5 text-center shadow-[var(--shadow-border)]">
      <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-display text-lg font-semibold tabular">{value}</dd>
    </div>
  );
}
