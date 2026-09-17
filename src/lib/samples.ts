import { destinationPoint, pathDistance } from "./geo";
import type { LatLng, RouteDraft } from "./types";

const MARINA_START: LatLng = { lat: 6.43695, lng: 3.3882 };

/** Marina waterfront, CMS toward Onikan — ~2.0 km one-way. */
export const MARINA_POINTS: LatLng[] = Array.from({ length: 8 }, (_, i) =>
  i === 0 ? MARINA_START : destinationPoint(MARINA_START, 56, (2000 / 7) * i),
);

const LEKKI_START: LatLng = { lat: 6.4398, lng: 3.4452 };

/** Lekki Phase 1 loop — ~4 km training circuit. */
export const LEKKI_POINTS: LatLng[] = [
  LEKKI_START,
  destinationPoint(LEKKI_START, 50, 900),
  destinationPoint(destinationPoint(LEKKI_START, 50, 900), 140, 1000),
  destinationPoint(destinationPoint(destinationPoint(LEKKI_START, 50, 900), 140, 1000), 230, 900),
  LEKKI_START,
];

export function sampleRoutes(): RouteDraft[] {
  const marinaDist = pathDistance(MARINA_POINTS);
  const lekkiDist = pathDistance(LEKKI_POINTS);
  return [
    {
      id: "sample_marina",
      name: "Marina Stretch",
      points: MARINA_POINTS,
      distanceM: marinaDist,
      targetPaceMinPerKm: 5,
      createdAt: Date.now() - 86400000 * 3,
      notes: "2 km waterfront. Pre-paced at 5:00 /km — ten minutes if you hold the ghost.",
    },
    {
      id: "sample_lekki",
      name: "Admiralty Loop",
      points: LEKKI_POINTS,
      distanceM: lekkiDist,
      targetPaceMinPerKm: 5.5,
      createdAt: Date.now() - 86400000 * 6,
      notes: "Lekki Phase 1 circuit. Trace it, set your pace, then run against the ghost.",
    },
  ];
}
