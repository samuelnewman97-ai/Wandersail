"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { HydrationGate } from "@/components/layout/HydrationGate";
import { todayIso, shiftDay } from "@/lib/date";
import type { Trip } from "@/lib/types";
import { Upload } from "lucide-react";

const EMOJI_CHOICES = ["✈️", "🗼", "🏝️", "🏔️", "🗽", "🏛️", "🌋", "🏰", "🌊", "🍜", "🗻", "⛩️"];

export default function NewTripPage() {
  const router = useRouter();
  const createTrip = useStore((s) => s.createTrip);
  const importTrip = useStore((s) => s.importTrip);
  const hasTrips = useStore((s) => Object.keys(s.trips).length > 0);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(shiftDay(todayIso(), 4));
  const [emoji, setEmoji] = useState("✈️");
  const [importError, setImportError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && startDate && endDate && startDate <= endDate;

  const onSubmit = () => {
    if (!canSubmit) return;
    const id = createTrip(name.trim(), startDate, endDate, emoji);
    router.push(`/trip/${id}`);
  };

  const onCancel = () => {
    // Always navigate to root — root redirects to first available trip, or
    // back here if no trips exist. Using router.back() can push to a stale
    // previous entry and cause a visible refresh.
    router.push("/");
  };

  const onImport = () => {
    setImportError(null);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Trip;
        if (!parsed || typeof parsed !== "object" || !parsed.name || !Array.isArray(parsed.activities)) {
          throw new Error("Not a valid Wandersail trip file");
        }
        const id = importTrip(parsed);
        router.push(`/trip/${id}`);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Could not read file");
      }
    };
    input.click();
  };

  return (
    <HydrationGate>
      <div className="min-h-screen grid place-items-center p-6 sm:p-8">
        <div className="max-w-lg w-full">
          <div className="stamp text-xs text-orange mb-2">— Begin a new journey —</div>
          <h1 className="display text-4xl sm:text-5xl mb-6">Plot your next trip.</h1>

          <div className="space-y-5">
            <div>
              <label className="field-label">Trip name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Paris Spring Break"
                className="field-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">End date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Emblem</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl w-12 h-12 border-2 border-ink ${emoji === e ? "bg-ink" : "bg-cream hover:bg-cream-dark"}`}
                    style={emoji === e ? { boxShadow: "3px 3px 0 var(--orange)" } : {}}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3 flex-wrap">
              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="btn-poster disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start planning →
              </button>
              {hasTrips && (
                <button onClick={onCancel} className="btn-poster btn-poster-secondary">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-0 border-t-2 border-dashed border-ink/30" />
            <div className="stamp text-[10px] text-ink/50">or</div>
            <div className="flex-1 h-0 border-t-2 border-dashed border-ink/30" />
          </div>

          <div className="border-2 border-ink bg-cream p-5" style={{ boxShadow: "4px 4px 0 var(--teal)" }}>
            <div className="stamp text-[10px] text-teal-dark mb-1">— Already planned a trip? —</div>
            <h2 className="display text-2xl mb-2">Import a saved trip</h2>
            <p className="text-sm text-ink/70 mb-4">
              Got a <code className="bg-cream-dark px-1 border border-ink/30">.json</code> file from a
              previous export (laptop, other device, or email)? Drop it here and pick up where you
              left off.
            </p>
            <button onClick={onImport} className="btn-poster btn-poster-secondary">
              <Upload size={14} /> Import JSON file
            </button>
            {importError && (
              <div className="stamp text-[10px] text-orange mt-3">⚠ {importError}</div>
            )}
          </div>
        </div>
      </div>
    </HydrationGate>
  );
}
