import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapPinned, RotateCcw, Route as RouteIcon, Share2, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { TraceMap } from "@/components/map/trace-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { pathDistance } from "@/lib/geo";
import { calculateRoadRoute } from "@/lib/osrm";
import { shareUrl } from "@/lib/share";
import { useTraceStore } from "@/lib/store";
import type { LatLng } from "@/lib/types";
import { formatClock, formatKm, formatPace, uid } from "@/lib/utils";

export const Route = createFileRoute("/trace")({ component: TracePage });

function TracePage() {
  const navigate = useNavigate();
  const saveRoute = useTraceStore((s) => s.saveRoute);
  const routes = useTraceStore((s) => s.routes);

  const [points, setPoints] = useState<LatLng[]>([]);
  const [name, setName] = useState("Untitled trace");
  const [pace, setPace] = useState(5);
  const [routing, setRouting] = useState(false);
  const [notes, setNotes] = useState("");

  const distanceM = useMemo(() => pathDistance(points), [points]);
  const eta = (distanceM / 1000) * pace * 60;

  function addPoint(p: LatLng) {
    setPoints((prev) => [...prev, p]);
  }

  async function snapRoads() {
    if (points.length < 2) {
      toast("Drop at least two pins first.");
      return;
    }
    setRouting(true);
    const snapped = await calculateRoadRoute(points);
    setRouting(false);
    if (!snapped) {
      toast("Could not reach the routing service. Keeping your drawn line.");
      return;
    }
    setPoints(snapped);
    toast("Snapped to walking paths.");
  }

  function save(thenRun: boolean) {
    if (points.length < 2) {
      toast("Trace at least two points.");
      return;
    }
    const route = {
      id: uid("route"),
      name: name.trim() || "Untitled trace",
      points,
      distanceM,
      targetPaceMinPerKm: pace,
      createdAt: Date.now(),
      notes: notes.trim() || undefined,
    };
    saveRoute(route);
    toast(`Saved ${route.name} · ${formatKm(distanceM)}`);
    if (thenRun) {
      void navigate({ to: "/run", search: { routeId: route.id } });
    }
  }

  async function share() {
    if (points.length < 2) return;
    const url = shareUrl(window.location.origin, {
      name: name.trim() || "Shared trace",
      points,
      pace,
      notes: notes.trim() || undefined,
    });
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `${formatKm(distanceM)} at ${formatPace(pace)} /km`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Share link copied.");
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast("Share link copied.");
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
        <header className="px-5 pt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Pre-trace</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Draw the path</h1>
          <p className="mt-1 text-sm text-muted">Tap the map to plot waypoints. Distance updates as you go.</p>
        </header>

        <div className="relative mx-5 mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
          <TraceMap
            points={points}
            onTap={addPoint}
            onMarkerDrag={(i, p) =>
              setPoints((prev) => prev.map((pt, idx) => (idx === i ? p : pt)))
            }
            className="h-full min-h-[220px] w-full"
          />
          <div className="pointer-events-none absolute left-3 top-3">
            <div className="pointer-events-auto rounded-lg bg-bg/90 px-3 py-2 shadow-[var(--shadow-border)]">
              <p className="text-[10px] uppercase tracking-wider text-muted">Live distance</p>
              <p className="font-display text-2xl font-semibold tabular">{formatKm(distanceM)}</p>
              <p className="text-xs text-muted">
                {points.length} pin{points.length === 1 ? "" : "s"} · {formatPace(pace)} /km ·{" "}
                {distanceM > 0 ? formatClock(eta) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rname">Route name</Label>
              <Input id="rname" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Target pace {formatPace(pace)} /km</Label>
              <Slider
                className="mt-3"
                min={3}
                max={10}
                step={0.05}
                value={[pace]}
                onValueChange={(v) => setPace(v[0] ?? 5)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPoints((p) => p.slice(0, -1))} disabled={!points.length}>
              <Undo2 className="size-3.5" />
              Undo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPoints([])} disabled={!points.length}>
              <RotateCcw className="size-3.5" />
              Clear
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void snapRoads()} disabled={routing || points.length < 2}>
              <MapPinned className="size-3.5" />
              {routing ? "Routing…" : "Snap to roads"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void share()} disabled={points.length < 2}>
              <Share2 className="size-3.5" />
              Share
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => save(false)}>
              Save route
            </Button>
            <Button className="flex-1" onClick={() => save(true)}>
              Save & run
            </Button>
          </div>
        </div>
      </div>

      {routes.length > 0 && (
        <section className="px-5 pb-6">
          <h2 className="mb-2 font-display text-lg font-semibold">Saved traces</h2>
          <ul className="space-y-2">
            {routes.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPoints(r.points);
                    setName(r.name);
                    setPace(r.targetPaceMinPerKm);
                    setNotes(r.notes ?? "");
                  }}
                  className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className="flex items-center gap-2">
                      <RouteIcon className="size-4 text-sage" />
                      <span className="font-medium">{r.name}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatKm(r.distanceM)} · {formatPace(r.targetPaceMinPerKm)} /km
                    </span>
                  </span>
                  <Badge variant="outline">{r.points.length} pts</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
