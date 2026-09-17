import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Play, Share2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { TraceMap } from "@/components/map/trace-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pathDistance } from "@/lib/geo";
import { decodeShare, shareUrl } from "@/lib/share";
import { useTraceStore } from "@/lib/store";
import { formatClock, formatKm, formatPace, uid } from "@/lib/utils";

type Search = { n?: string; p?: string; k?: string; m?: string };

export const Route = createFileRoute("/share")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    n: typeof raw.n === "string" ? raw.n : undefined,
    p: typeof raw.p === "string" ? raw.p : undefined,
    k: typeof raw.k === "string" ? raw.k : undefined,
    m: typeof raw.m === "string" ? raw.m : undefined,
  }),
  component: SharePage,
});

function SharePage() {
  const search = Route.useSearch();
  const incoming = useMemo(() => {
    if (!search.p) return null;
    const qs = new URLSearchParams();
    if (search.n) qs.set("n", search.n);
    qs.set("p", search.p);
    if (search.k) qs.set("k", search.k);
    if (search.m) qs.set("m", search.m);
    return decodeShare(qs.toString());
  }, [search]);
  const saveRoute = useTraceStore((s) => s.saveRoute);
  const routes = useTraceStore((s) => s.routes);

  async function copy(url: string, title: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(url);
    toast("Link copied.");
  }

  if (incoming) {
    const dist = pathDistance(incoming.points);
    return (
      <AppShell>
        <header className="px-5 pt-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Shared route</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{incoming.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {formatKm(dist)} · {formatPace(incoming.pace)} /km ·{" "}
            {formatClock((dist / 1000) * incoming.pace * 60)} target
          </p>
        </header>
        <div className="mx-5 mt-4 h-64 overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
          <TraceMap points={incoming.points} className="h-full w-full" interactive={false} />
        </div>
        {incoming.notes && <p className="px-5 pt-3 text-sm text-muted">{incoming.notes}</p>}
        <div className="mt-4 flex gap-2 px-5">
          <Button
            className="flex-1"
            onClick={() => {
              const id = uid("route");
              saveRoute({
                id,
                name: incoming.name,
                points: incoming.points,
                distanceM: dist,
                targetPaceMinPerKm: incoming.pace,
                createdAt: Date.now(),
                notes: incoming.notes,
              });
              toast("Saved to your traces.");
            }}
          >
            Save to my traces
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link to="/run">
              <Play className="size-4" />
              Run
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Share</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Routes & live</h1>
        <p className="mt-2 text-sm text-muted">
          Send a traced path as a link. For live location, start a run with Live on and open the Live tab.
        </p>
      </header>
      <div className="mt-5 space-y-2 px-5 pb-6">
        <Button asChild variant="secondary" className="w-full">
          <Link to="/live">Open live follow</Link>
        </Button>
        {routes.map((r) => {
          const url =
            typeof window === "undefined"
              ? ""
              : shareUrl(window.location.origin, {
                  name: r.name,
                  points: r.points,
                  pace: r.targetPaceMinPerKm,
                  notes: r.notes,
                });
          return (
            <Card key={r.id} className="rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted">
                    {formatKm(r.distanceM)} · {formatPace(r.targetPaceMinPerKm)} /km
                  </p>
                </div>
                <Share2 className="size-4 text-muted" />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => void copy(url, r.name)}>
                  <Copy className="size-3.5" />
                  Copy link
                </Button>
                <Button asChild size="sm">
                  <Link to="/run" search={{ routeId: r.id }}>
                    Run it
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
