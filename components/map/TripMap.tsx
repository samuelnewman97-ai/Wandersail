"use client";

import { useMemo } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Trip, Activity } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { compareDateTime } from "@/lib/date";

interface Props {
  trip: Trip;
  token: string;
  onSelectActivity: (id: string) => void;
  selectedId: string | null;
}

export default function TripMap({ trip, token, onSelectActivity, selectedId }: Props) {
  const geo = useMemo(() => {
    return [...trip.activities]
      .sort(compareDateTime)
      .filter((a): a is Activity & { location: { lat: number; lng: number; label: string } } =>
        typeof a.location.lat === "number" && typeof a.location.lng === "number"
      );
  }, [trip.activities]);

  const center = useMemo(() => {
    if (geo.length === 0) return { longitude: 2.3522, latitude: 48.8566, zoom: 10 };
    const avgLng = geo.reduce((s, a) => s + a.location.lng, 0) / geo.length;
    const avgLat = geo.reduce((s, a) => s + a.location.lat, 0) / geo.length;
    return { longitude: avgLng, latitude: avgLat, zoom: 11 };
  }, [geo]);

  const lineData = useMemo(
    () => ({
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: geo.map((a) => [a.location.lng, a.location.lat]),
      },
    }),
    [geo]
  );

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={center}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
    >
      {geo.length >= 2 && (
        <Source id="route" type="geojson" data={lineData}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#1a1a1a",
              "line-width": 3,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      )}
      {geo.map((a, i) => {
        const meta = CATEGORY_META[a.category];
        const selected = selectedId === a.id;
        return (
          <Marker key={a.id} longitude={a.location.lng} latitude={a.location.lat} anchor="center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectActivity(a.id);
              }}
              aria-label={a.title}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "block",
                lineHeight: 0,
                padding: 0,
                margin: 0,
                border: "none",
                background: "transparent",
              }}
            >
              <div
                className={`w-9 h-9 rounded-full grid place-items-center text-cream font-bold text-sm border-2 border-ink transition-transform ${selected ? "scale-125" : ""}`}
                style={{ background: meta.color }}
              >
                {i + 1}
              </div>
            </button>
          </Marker>
        );
      })}
    </Map>
  );
}
