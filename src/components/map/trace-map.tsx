import { useEffect, useRef } from "react";
import type { LatLng } from "@/lib/types";
import { LAGOS } from "@/lib/geo";
import "leaflet/dist/leaflet.css";

const OPEN_STREET_MAP_TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

type MarkerSpec = {
  id: string;
  position: LatLng;
  kind: "you" | "ghost" | "start" | "end" | "pin" | "watcher";
  label?: string;
};

type Props = {
  points: LatLng[];
  ghost?: LatLng | null;
  you?: LatLng | null;
  onTap?: (p: LatLng) => void;
  onMarkerDrag?: (index: number, p: LatLng) => void;
  follow?: boolean;
  className?: string;
  extraMarkers?: MarkerSpec[];
  interactive?: boolean;
};

export function TraceMap({
  points,
  ghost,
  you,
  onTap,
  onMarkerDrag,
  follow,
  className,
  extraMarkers,
  interactive = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onTapRef = useRef(onTap);
  const onDragRef = useRef(onMarkerDrag);
  onTapRef.current = onTap;
  onDragRef.current = onMarkerDrag;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet").then((L) => {
      if (cancelled || !el) return;
      map = L.map(el, {
        zoomControl: true,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        tapTolerance: 20,
      } as any);
      L.tileLayer(OPEN_STREET_MAP_TILE, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 2,
        crossOrigin: true,
      }).addTo(map);

      const center = points[0] ?? you ?? LAGOS;
      map.setView([center.lat, center.lng], points.length > 1 ? 14 : 13);
      lineRef.current = L.polyline([], {
        color: "#eceeea",
        weight: 5,
        opacity: 0.92,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        onTapRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      lineRef.current = null;
      layerRef.current = null;
    };
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const line = lineRef.current;
    const layers = layerRef.current;
    if (!map || !line || !layers) return;
    void import("leaflet").then((L) => {
      line.setLatLngs(points.map((p) => [p.lat, p.lng] as [number, number]));
      layers.clearLayers();

      const addDiv = (p: LatLng, html: string, draggable?: boolean, idx?: number) => {
        const icon = L.divIcon({
          className: "trace-marker",
          html,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([p.lat, p.lng], { icon, draggable: Boolean(draggable) });
        if (draggable && idx !== undefined) {
          m.on("dragend", () => {
            const ll = m.getLatLng();
            onDragRef.current?.(idx, { lat: ll.lat, lng: ll.lng });
          });
        }
        m.addTo(layers);
      };

      if (points.length) {
        addDiv(
          points[0]!,
          `<div style="width:12px;height:12px;border-radius:999px;background:#eceeea;box-shadow:0 0 0 4px rgba(236,238,234,.18)"></div>`,
        );
        if (points.length > 1) {
          addDiv(
            points[points.length - 1]!,
            `<div style="width:12px;height:12px;border-radius:3px;background:#8fa392;box-shadow:0 0 0 4px rgba(143,163,146,.2)"></div>`,
          );
        }
      }

      if (onTapRef.current && points.length > 2) {
        points.forEach((p, i) => {
          if (i === 0 || i === points.length - 1) return;
          addDiv(
            p,
            `<div style="width:8px;height:8px;border-radius:999px;background:#c5cec4;opacity:.7"></div>`,
            true,
            i,
          );
        });
      }

      if (you) {
        addDiv(
          you,
          `<div style="width:16px;height:16px;border-radius:999px;background:#eceeea;border:3px solid #0b0d0c;box-shadow:0 0 0 6px rgba(236,238,234,.16)"></div>`,
        );
      }
      if (ghost) {
        addDiv(
          ghost,
          `<div style="width:14px;height:14px;border-radius:999px;border:2px solid #8fa392;background:transparent"></div>`,
        );
      }
      extraMarkers?.forEach((m) => {
        addDiv(
          m.position,
          `<div style="width:12px;height:12px;border-radius:999px;background:#c9846a"></div>`,
        );
      });

      if (follow && you) {
        map.panTo([you.lat, you.lng], { animate: true, duration: 0.4 });
      } else if (points.length > 1) {
        const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        if (you) b.extend([you.lat, you.lng]);
        if (ghost) b.extend([ghost.lat, ghost.lng]);
        map.fitBounds(b.pad(0.18));
      }
    });
  }, [points, you, ghost, extraMarkers, follow]);

  return <div ref={hostRef} className={className ?? "h-full w-full"} />;
}
