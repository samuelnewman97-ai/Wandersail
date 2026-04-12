"use client";

import { use, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { compareDateTime } from "@/lib/date";
import { CATEGORY_META } from "@/lib/categories";
import { MapPin, Info, Check, X } from "lucide-react";

const TripMap = dynamic(() => import("@/components/map/TripMap"), { ssr: false });

export default function MapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const storedToken = useStore((s) => s.mapboxToken);
  const setMapboxToken = useStore((s) => s.setMapboxToken);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");

  const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const token = storedToken ?? envToken ?? null;

  const ordered = useMemo(() => (trip ? [...trip.activities].sort(compareDateTime) : []), [trip]);
  const withCoords = ordered.filter((a) => typeof a.location.lat === "number" && typeof a.location.lng === "number");
  const missingCount = ordered.length - withCoords.length;

  if (!trip) return null;

  const saveToken = () => {
    const t = tokenInput.trim();
    if (!t) return;
    setMapboxToken(t);
    setTokenInput("");
  };

  const clearToken = () => {
    if (confirm("Remove the saved Mapbox token?")) setMapboxToken(null);
  };

  return (
    <div>
      <PosterHeader trip={trip} subtitle="The path across the map." />

      {!token ? (
        <div className="border-2 border-ink p-6 bg-cream" style={{ boxShadow: "4px 4px 0 var(--orange)" }}>
          <div className="flex items-start gap-3">
            <Info className="shrink-0 text-orange" size={24} />
            <div className="flex-1">
              <h3 className="display text-2xl mb-2">Paste your Mapbox token</h3>
              <p className="text-sm text-ink/80 mb-4">
                Mapbox powers the map view. It's free for personal use — grab a public token and paste it below.
                It's saved to your browser only.
              </p>

              <div className="flex gap-2 mb-3">
                <input
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveToken()}
                  placeholder="pk.eyJ1..."
                  className="field-input flex-1 font-mono text-xs"
                  spellCheck={false}
                />
                <button
                  onClick={saveToken}
                  disabled={!tokenInput.trim()}
                  className="btn-poster disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save token
                </button>
              </div>

              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="stamp text-xs text-teal-dark hover:text-orange underline"
              >
                Get a free token from Mapbox →
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:grid md:grid-cols-[1fr_320px] gap-4">
            <div
              className="border-2 border-ink overflow-hidden"
              style={{ boxShadow: "4px 4px 0 var(--teal)", height: "55vh", minHeight: 320 }}
            >
              <TripMap trip={trip} token={token} onSelectActivity={setSelectedId} selectedId={selectedId} />
            </div>
            <div
              className="border-2 border-ink bg-cream overflow-y-auto"
              style={{ boxShadow: "4px 4px 0 var(--ink)", maxHeight: "70vh" }}
            >
              <div className="p-3 border-b-2 border-ink stamp text-xs text-teal-dark sticky top-0 bg-cream">
                Stops ({withCoords.length})
              </div>
              {missingCount > 0 && (
                <div className="p-3 bg-orange/10 border-b border-ink/30 text-xs text-ink">
                  {missingCount} {missingCount === 1 ? "activity is" : "activities are"} missing coordinates. Edit them to add lat/lng.
                </div>
              )}
              <ul>
                {withCoords.map((a, i) => {
                  const meta = CATEGORY_META[a.category];
                  const active = selectedId === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => setSelectedId(a.id)}
                        className={`w-full text-left p-3 flex items-start gap-3 border-b border-dashed border-ink/30 ${active ? "bg-cream-dark" : "hover:bg-cream-dark"}`}
                      >
                        <div
                          className="w-7 h-7 rounded-full grid place-items-center text-cream font-bold text-xs border-2 border-ink shrink-0"
                          style={{ background: meta.color }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{a.title}</div>
                          <div className="stamp text-[9px] text-teal-dark flex items-center gap-1">
                            <MapPin size={9} /> {a.location.label}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {withCoords.length === 0 && (
                  <li className="p-6 text-center text-xs text-ink/60">
                    No activities with coordinates yet. Add lat/lng to your activities to see them here.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 stamp text-[10px] text-teal-dark">
            <Check size={11} className="text-teal" />
            <span>
              Mapbox token saved {storedToken ? "in browser" : "via environment variable"}.
            </span>
            {storedToken && (
              <button onClick={clearToken} className="hover:text-orange underline inline-flex items-center gap-1">
                <X size={10} /> Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
