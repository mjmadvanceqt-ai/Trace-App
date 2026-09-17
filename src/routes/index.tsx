import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Footprints, Play, Route as RouteIcon, Share2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ensureNotificationPermission } from "@/lib/notifications";
import { useTraceStore } from "@/lib/store";
import { formatClock, formatKm, formatPace, todayKey } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const steps = useTraceStore((s) => s.todaySteps());
  const goal = useTraceStore((s) => s.stepGoal);
  const routes = useTraceStore((s) => s.routes);
  const activities = useTraceStore((s) => s.activities);
  const plans = useTraceStore((s) => s.plans);
  const notificationsOn = useTraceStore((s) => s.notificationsOn);
  const setNotificationsOn = useTraceStore((s) => s.setNotificationsOn);
  const name = useTraceStore((s) => s.displayName);

  const pct = Math.min(100, Math.round((steps / Math.max(1, goal)) * 100));
  const todayPlans = plans.filter((p) => p.date === todayKey());
  const openPlans = todayPlans.filter((p) => !p.done);
  const last = activities[0];
  const featured = routes[0];

  return (
    <AppShell>
      <header className="stagger-in px-5 pt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">The Trace</p>
        <h1 className="mt-2 font-display text-[2.15rem] font-semibold leading-[1.05] tracking-tight">
          Draw the run.
          <br />
          Hold the pace.
        </h1>
        <p className="mt-3 max-w-[34ch] text-sm text-muted">
          {greeting()}, {name}. Pre-trace a path, lock a split, and the coach will pull you back if you drift.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 px-5">
        <Card className="col-span-2 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Today · steps</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular">{steps.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted">
                {pct}% of {goal.toLocaleString()}
              </p>
            </div>
            <Footprints className="size-5 text-sage" strokeWidth={1.5} />
          </div>
          <Progress value={pct} className="mt-4" />
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm">
              <Link to="/steps">Open steps</Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await ensureNotificationPermission();
                setNotificationsOn(ok);
              }}
            >
              <Bell className="size-3.5" />
              {notificationsOn ? "Alerts on" : "Enable alerts"}
            </Button>
          </div>
        </Card>

        <Link to="/trace" className="block">
          <Card className="h-full rounded-2xl p-4 transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
            <RouteIcon className="size-4 text-primary" />
            <p className="mt-3 font-display text-lg font-semibold">Trace</p>
            <p className="mt-1 text-xs text-muted">Draw a route. Distance live as you plot.</p>
          </Card>
        </Link>
        <Link to="/run" className="block">
          <Card className="h-full rounded-2xl p-4 transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
            <Play className="size-4 text-primary" />
            <p className="mt-3 font-display text-lg font-semibold">Run</p>
            <p className="mt-1 text-xs text-muted">Race the ghost. Alerts if you fall behind.</p>
          </Card>
        </Link>
      </section>

      {featured && (
        <section className="mt-6 px-5">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="font-display text-lg font-semibold">Ready to run</h2>
            <Link to="/trace" className="text-xs text-muted">
              All routes
            </Link>
          </div>
          <Link
            to="/run"
            search={{ routeId: featured.id }}
            className="block"
          >
            <Card className="rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold">{featured.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatKm(featured.distanceM)} · {formatPace(featured.targetPaceMinPerKm)} /km ·{" "}
                    {formatClock(
                      (featured.distanceM / 1000) * featured.targetPaceMinPerKm * 60,
                    )}{" "}
                    target
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted" />
              </div>
              <p className="mt-3 text-xs text-muted">{featured.notes}</p>
            </Card>
          </Link>
        </section>
      )}

      <section className="mt-6 px-5">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Today’s plan</h2>
          <Link to="/plan" className="text-xs text-muted">
            Planner
          </Link>
        </div>
        <Card className="rounded-2xl p-2">
          {openPlans.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">All clear. Add a run or a goal in Plan.</p>
          ) : (
            <ul className="divide-y divide-border">
              {openPlans.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.kind}
                      {p.time ? ` · ${p.time}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{p.kind}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {last && (
        <section className="mt-6 px-5 pb-4">
          <h2 className="mb-2 font-display text-lg font-semibold">Last outing</h2>
          <Card className="rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{last.name}</p>
              <Badge variant={last.hitTarget ? "sage" : "warn"}>
                {last.hitTarget ? "Target hit" : "Missed target"}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted">Distance</dt>
                <dd className="font-display text-lg tabular">{formatKm(last.distanceM, 2)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted">Time</dt>
                <dd className="font-display text-lg tabular">{formatClock(last.durationSec)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-muted">Pace</dt>
                <dd className="font-display text-lg tabular">{formatPace(last.avgPaceMinPerKm)}</dd>
              </div>
            </dl>
          </Card>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="secondary" className="flex-1">
              <Link to="/activity">
                History
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/share">
                <Share2 className="size-4" />
                Share
              </Link>
            </Button>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}
