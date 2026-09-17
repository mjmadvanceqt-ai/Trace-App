import { decodePolyline, encodePolyline, pathDistance } from "./geo";
import type { LatLng } from "./types";

export type SharedRoute = {
  name: string;
  points: LatLng[];
  pace: number;
  notes?: string;
};

export function encodeShare(route: SharedRoute): string {
  const poly = encodePolyline(route.points);
  const params = new URLSearchParams();
  params.set("n", route.name);
  params.set("p", poly);
  params.set("k", String(route.pace));
  if (route.notes) params.set("m", route.notes.slice(0, 180));
  return params.toString();
}

export function decodeShare(search: string): SharedRoute | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const n = params.get("n") ?? "Shared route";
    const p = params.get("p");
    const k = Number(params.get("k") ?? 5);
    const m = params.get("m") ?? undefined;
    if (!p) return null;
    const points = decodePolyline(p);
    if (points.length < 2) return null;
    return { name: n, points, pace: Number.isFinite(k) ? k : 5, notes: m };
  } catch {
    return null;
  }
}

export function shareUrl(origin: string, route: SharedRoute): string {
  return `${origin}/share?${encodeShare(route)}`;
}

export function liveCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export const LIVE_PREFIX = "trace-live-";

export function liveChannelName(code: string) {
  return `${LIVE_PREFIX}${code.toUpperCase()}`;
}

export function routeSummary(points: LatLng[]) {
  return { distanceM: pathDistance(points), count: points.length };
}
