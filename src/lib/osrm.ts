import type { LatLng } from "./types";

const ROUTE_APIS = [
  "https://router.project-osrm.org/route/v1/foot",
  "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
  "https://router.here.com/routing/7.2/calculateroute.json?mode=fastest%3Bpedestrian%3Btraffic%3Adisabled",
];

export async function calculateRoadRoute(waypoints: LatLng[]): Promise<LatLng[] | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");

  for (const base of ROUTE_APIS) {
    let url: string;
    if (base.includes("here.com")) {
      url = `${base}&waypoint0=${waypoints[0]!.lat},${waypoints[0]!.lng}&waypoint1=${waypoints[waypoints.length - 1]!.lat},${waypoints[waypoints.length - 1]!.lng}`;
    } else {
      url = `${base}/${coords}?overview=full&geometries=geojson`;
    }

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        code?: string;
        routes?: { geometry?: { coordinates?: [number, number][] } }[];
        response?: { route?: [{ shape?: { points?: string } }] };
      };

      if (data.routes?.[0]?.geometry?.coordinates?.length) {
        const line = data.routes[0].geometry.coordinates;
        return line.map(([lng, lat]) => ({ lat, lng }));
      }

      const hereRoute = data.response?.route?.[0]?.shape?.points;
      if (hereRoute) {
        return decodePolyline(hereRoute);
      }
    } catch {
      // Try the next public router until one succeeds.
    }
  }

  return null;
}

function decodePolyline(encoded: string): LatLng[] {
  if (!encoded) return [];
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}
