"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { downloadJson, downloadIcs } from "@/lib/export";
import { Download, Trash2, Save, Map as MapIcon } from "lucide-react";

const EMOJI_CHOICES = ["✈️", "🗼", "🏝️", "🏔️", "🗽", "🏛️", "🌋", "🏰", "🌊", "🍜", "🗻", "⛩️"];

export default function SettingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const router = useRouter();
  const trip = useStore((s) => s.trips[tripId]);
  const updateMeta = useStore((s) => s.updateTripMeta);
  const deleteTrip = useStore((s) => s.deleteTrip);
  const mapboxToken = useStore((s) => s.mapboxToken);
  const setMapboxToken = useStore((s) => s.setMapboxToken);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [emoji, setEmoji] = useState("✈️");
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setCurrency(trip.currency);
      setEmoji(trip.coverEmoji);
    }
  }, [trip]);

  if (!trip) return null;

  const save = () => {
    updateMeta(tripId, { name, startDate, endDate, currency, coverEmoji: emoji });
  };

  const onDelete = () => {
    if (confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
      deleteTrip(tripId);
      router.push("/");
    }
  };

  return (
    <div>
      <PosterHeader trip={trip} subtitle="Trip settings & archives." />

      <div className="space-y-8 max-w-2xl">
        <section>
          <h2 className="display text-2xl mb-4 text-teal-dark">Details</h2>
          <div className="space-y-4">
            <div>
              <label className="field-label">Trip name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field-input" />
              </div>
              <div>
                <label className="field-label">End date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field-input" />
              </div>
            </div>
            <div>
              <label className="field-label">Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className="field-input max-w-32" />
            </div>
            <div>
              <label className="field-label">Emblem</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-2xl w-12 h-12 border-2 border-ink ${emoji === e ? "bg-ink" : "bg-cream hover:bg-cream-dark"}`}
                    style={emoji === e ? { boxShadow: "3px 3px 0 var(--orange)" } : {}}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={save} className="btn-poster">
              <Save size={14} /> Save changes
            </button>
          </div>
        </section>

        <hr className="divider-dashed" />

        <section>
          <h2 className="display text-2xl mb-4 text-teal-dark flex items-center gap-2">
            <MapIcon size={22} /> Mapbox token
          </h2>
          {mapboxToken ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 font-mono text-xs bg-cream-dark border-2 border-ink p-2 truncate">
                {mapboxToken.slice(0, 12)}…{mapboxToken.slice(-6)}
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove the saved Mapbox token?")) setMapboxToken(null);
                }}
                className="btn-poster btn-poster-secondary"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="pk.eyJ1..."
                className="field-input flex-1 font-mono text-xs"
                spellCheck={false}
              />
              <button
                onClick={() => {
                  if (tokenInput.trim()) {
                    setMapboxToken(tokenInput.trim());
                    setTokenInput("");
                  }
                }}
                disabled={!tokenInput.trim()}
                className="btn-poster disabled:opacity-40"
              >
                <Save size={14} /> Save
              </button>
            </div>
          )}
          <p className="text-xs text-ink/60 mt-2">
            Stored in this browser only.{" "}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange">
              Get a free token →
            </a>
          </p>
        </section>

        <hr className="divider-dashed" />

        <section>
          <h2 className="display text-2xl mb-4 text-teal-dark">Export</h2>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => downloadJson(trip)} className="btn-poster btn-poster-secondary">
              <Download size={14} /> Export JSON
            </button>
            <button onClick={() => downloadIcs(trip)} className="btn-poster btn-poster-secondary">
              <Download size={14} /> Export .ics
            </button>
          </div>
          <p className="text-xs text-ink/60 mt-2">
            JSON is a full backup (re-importable). .ics adds activities to any calendar app.
          </p>
        </section>

        <hr className="divider-dashed" />

        <section>
          <h2 className="display text-2xl mb-4 text-orange">Danger zone</h2>
          <button onClick={onDelete} className="btn-poster" style={{ background: "#d9622b", boxShadow: "4px 4px 0 var(--ink)" }}>
            <Trash2 size={14} /> Delete trip
          </button>
        </section>
      </div>
    </div>
  );
}
