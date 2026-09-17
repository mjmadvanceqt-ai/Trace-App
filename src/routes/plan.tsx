import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTraceStore } from "@/lib/store";
import type { PlanKind } from "@/lib/types";
import { formatKm, formatPace, todayKey } from "@/lib/utils";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  const plans = useTraceStore((s) => s.plans);
  const routes = useTraceStore((s) => s.routes);
  const addPlan = useTraceStore((s) => s.addPlan);
  const togglePlan = useTraceStore((s) => s.togglePlan);
  const deletePlan = useTraceStore((s) => s.deletePlan);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PlanKind>("run");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("07:00");
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");

  const grouped = useMemo(() => {
    const map = new Map<string, typeof plans>();
    for (const p of plans) {
      const list = map.get(p.date) ?? [];
      list.push(p);
      map.set(p.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [plans]);

  const todayDone = plans.filter((p) => p.date === todayKey() && p.done).length;
  const todayTotal = plans.filter((p) => p.date === todayKey()).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const route = routes.find((r) => r.id === routeId);
    addPlan({
      kind,
      title: title.trim(),
      date,
      time,
      routeId: kind === "run" ? routeId : undefined,
      targetPaceMinPerKm: kind === "run" ? route?.targetPaceMinPerKm : undefined,
      targetDistanceM: kind === "run" ? route?.distanceM : undefined,
    });
    setTitle("");
    setOpen(false);
  }

  return (
    <AppShell>
      <header className="flex items-end justify-between px-5 pt-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Productivity</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Plan</h1>
          <p className="mt-1 text-sm text-muted">
            {todayDone}/{todayTotal || 0} complete today
          </p>
        </div>
        <Button size="icon" onClick={() => setOpen(true)} aria-label="Add plan item">
          <Plus className="size-4" />
        </Button>
      </header>

      <div className="mt-5 space-y-6 px-5 pb-6">
        {grouped.length === 0 && (
          <Card className="rounded-2xl p-6 text-center">
            <CalendarCheck className="mx-auto size-5 text-sage" />
            <p className="mt-3 text-sm text-muted">No items yet. Schedule a run or a daily goal.</p>
          </Card>
        )}
        {grouped.map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">
              {labelDay(day)}
            </h2>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Card className="flex items-start gap-3 rounded-2xl p-3">
                    <button
                      type="button"
                      onClick={() => togglePlan(item.id)}
                      className={`mt-0.5 size-5 shrink-0 rounded-sm shadow-[var(--shadow-border)] ${
                        item.done ? "bg-sage" : "bg-surface-2"
                      }`}
                      aria-label={item.done ? "Mark not done" : "Mark done"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.done ? "text-muted line-through" : ""}`}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.time ? `${item.time} · ` : ""}
                        {item.kind}
                        {item.targetDistanceM
                          ? ` · ${formatKm(item.targetDistanceM)} @ ${formatPace(item.targetPaceMinPerKm ?? 5)}`
                          : ""}
                      </p>
                      {item.kind === "run" && item.routeId && !item.done && (
                        <Button asChild size="sm" variant="secondary" className="mt-2">
                          <Link to="/run" search={{ routeId: item.routeId }}>
                            Start this run
                          </Link>
                        </Button>
                      )}
                    </div>
                    <Badge variant="outline">{item.kind}</Badge>
                    <button
                      type="button"
                      className="size-9 text-muted hover:text-fg"
                      onClick={() => deletePlan(item.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="mx-auto size-4" />
                    </button>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>New item</DialogTitle>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["run", "task", "goal"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`h-11 rounded-md text-sm capitalize ${
                    kind === k ? "bg-primary text-primary-fg" : "bg-surface-2"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" className="mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            {kind === "run" && routes.length > 0 && (
              <label className="block">
                <span className="text-xs text-muted">Route</span>
                <select
                  className="mt-1 h-11 w-full rounded-md bg-surface-2 px-3 text-sm"
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button type="submit" className="w-full">
              Add to plan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function labelDay(iso: string) {
  if (iso === todayKey()) return "Today";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
