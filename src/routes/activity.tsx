import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTraceStore } from "@/lib/store";
import { formatClock, formatKm, formatPace } from "@/lib/utils";

export const Route = createFileRoute("/activity")({ component: ActivityPage });

function ActivityPage() {
  const activities = useTraceStore((s) => s.activities);
  const totalKm = activities.reduce((s, a) => s + a.distanceM, 0) / 1000;
  const hits = activities.filter((a) => a.hitTarget).length;

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Log</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Activity</h1>
        <p className="mt-2 text-sm text-muted">
          {activities.length} runs · {totalKm.toFixed(1)} km · {hits} on target
        </p>
      </header>
      <ul className="mt-5 space-y-2 px-5 pb-6">
        {activities.length === 0 && (
          <Card className="rounded-2xl p-6 text-center text-sm text-muted">
            No runs yet.{" "}
            <Link to="/trace" className="text-primary">
              Trace a route
            </Link>{" "}
            and go.
          </Card>
        )}
        {activities.map((a) => (
          <li key={a.id}>
            <Card className="rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(a.startedAt).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant={a.hitTarget ? "sage" : "warn"}>
                  {a.hitTarget ? "On target" : "Off target"}
                </Badge>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted">Dist</dt>
                  <dd className="font-display tabular">{formatKm(a.distanceM)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted">Time</dt>
                  <dd className="font-display tabular">{formatClock(a.durationSec)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-muted">Pace</dt>
                  <dd className="font-display tabular">{formatPace(a.avgPaceMinPerKm)}</dd>
                </div>
              </dl>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
