import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TraceMap } from "@/components/map/trace-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type LivePacket, subscribeLive } from "@/lib/live";
import { useTraceStore } from "@/lib/store";
import { formatClock, formatKm } from "@/lib/utils";

type Search = { code?: string };

export const Route = createFileRoute("/live")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    code: typeof raw.code === "string" ? raw.code : undefined,
  }),
  component: LivePage,
});

function LivePage() {
  const search = Route.useSearch();
  const stored = useTraceStore((s) => s.liveCode);
  const [code, setCode] = useState((search.code ?? stored ?? "").toUpperCase());
  const [watching, setWatching] = useState(Boolean(search.code ?? stored));
  const [packet, setPacket] = useState<LivePacket | null>(null);

  useEffect(() => {
    if (!watching || !code) return;
    return subscribeLive(code, setPacket);
  }, [watching, code]);

  const points = packet?.points ?? [];
  const you = packet ? { lat: packet.fix.lat, lng: packet.fix.lng } : null;

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Live location</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Follow a run</h1>
        <p className="mt-2 text-sm text-muted">
          Enter the six-character code from the runner. Same-browser tabs update live; copy the code to another device
          on this app to follow when both stay open.
        </p>
      </header>

      <form
        className="mt-5 flex gap-2 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          setWatching(true);
        }}
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Code"
          maxLength={8}
          className="font-mono tracking-[0.2em]"
        />
        <Button type="submit">Follow</Button>
      </form>

      {watching && (
        <div className="mt-4 px-5 pb-6">
          <div className="h-64 overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
            <TraceMap
              points={points}
              you={you}
              follow
              className="h-full w-full"
              interactive={false}
            />
          </div>
          <Card className="mt-3 rounded-2xl p-4">
            {packet ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Radio className="size-4 text-sage" />
                  {packet.runner} · {packet.routeName ?? "Live"}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted">Elapsed</dt>
                    <dd className="font-display text-xl tabular">{formatClock(packet.fix.elapsedSec)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted">Covered</dt>
                    <dd className="font-display text-xl tabular">{formatKm(packet.fix.distanceM)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-muted">
                  Last fix {new Date(packet.fix.at).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">Waiting for {code || "the runner"} to publish a fix…</p>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
