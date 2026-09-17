import { createFileRoute } from "@tanstack/react-router";
import { Footprints } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useTraceStore } from "@/lib/store";
import { todayKey } from "@/lib/utils";

export const Route = createFileRoute("/steps")({ component: StepsPage });

function StepsPage() {
  const stepsByDay = useTraceStore((s) => s.stepsByDay);
  const goal = useTraceStore((s) => s.stepGoal);
  const setGoal = useTraceStore((s) => s.setStepGoal);
  const addSteps = useTraceStore((s) => s.addSteps);
  const tracking = useTraceStore((s) => s.trackingSteps);
  const setTracking = useTraceStore((s) => s.setTrackingSteps);
  const today = useTraceStore((s) => s.todaySteps());
  const lastPeak = useRef(0);
  const lastStepAt = useRef(0);

  useEffect(() => {
    if (!tracking) return;
    const trickle = window.setInterval(() => {
      if (document.hidden) return;
      addSteps(Math.random() > 0.45 ? 1 : 0);
    }, 2800);

    const onMotion = (ev: DeviceMotionEvent) => {
      const a = ev.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      if (mag > 12.2 && mag < lastPeak.current && now - lastStepAt.current > 280) {
        lastStepAt.current = now;
        addSteps(1);
      }
      lastPeak.current = mag;
    };
    window.addEventListener("devicemotion", onMotion);
    return () => {
      window.clearInterval(trickle);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [tracking, addSteps]);

  const week = useMemo(() => {
    const days: { label: string; steps: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        steps: stepsByDay[key] ?? 0,
      });
    }
    return days;
  }, [stepsByDay]);

  const pct = Math.min(100, Math.round((today / Math.max(1, goal)) * 100));

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Pedometer</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Steps</h1>
      </header>

      <Card className="mx-5 mt-5 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Today</p>
            <p className="mt-1 font-display text-5xl font-semibold tabular">{today.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted">
              {pct}% of {goal.toLocaleString()}
            </p>
          </div>
          <Footprints className="size-5 text-sage" />
        </div>
        <Progress value={pct} className="mt-4" />
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => addSteps(250)}>
            +250
          </Button>
          <Button size="sm" variant="secondary" onClick={() => addSteps(1000)}>
            +1,000
          </Button>
        </div>
      </Card>

      <Card className="mx-5 mt-4 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Live tracking</p>
            <p className="text-xs text-muted">Motion when available, plus a light idle trickle for the desk preview.</p>
          </div>
          <Switch checked={tracking} onCheckedChange={setTracking} />
        </div>
      </Card>

      <Card className="mx-5 mt-4 rounded-2xl p-4">
        <p className="text-sm font-medium">Daily goal · {goal.toLocaleString()}</p>
        <Slider
          className="mt-4"
          min={4000}
          max={20000}
          step={500}
          value={[goal]}
          onValueChange={(v) => setGoal(v[0] ?? 10000)}
        />
      </Card>

      <section className="px-5 py-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Seven days</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={week} barSize={18}>
              <XAxis dataKey="label" tick={{ fill: "#8b928c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(236,238,234,0.04)" }}
                contentStyle={{
                  background: "#141816",
                  border: "1px solid rgba(236,238,234,0.12)",
                  borderRadius: 12,
                  color: "#eceeea",
                }}
              />
              <Bar dataKey="steps" fill="#c5cec4" radius={[6, 6, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}
