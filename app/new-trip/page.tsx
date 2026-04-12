"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { HydrationGate } from "@/components/layout/HydrationGate";
import { todayIso, shiftDay } from "@/lib/date";

const EMOJI_CHOICES = ["✈️", "🗼", "🏝️", "🏔️", "🗽", "🏛️", "🌋", "🏰", "🌊", "🍜", "🗻", "⛩️"];

export default function NewTripPage() {
  const router = useRouter();
  const createTrip = useStore((s) => s.createTrip);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(shiftDay(todayIso(), 4));
  const [emoji, setEmoji] = useState("✈️");

  const canSubmit = name.trim().length > 0 && startDate && endDate && startDate <= endDate;

  const onSubmit = () => {
    if (!canSubmit) return;
    const id = createTrip(name.trim(), startDate, endDate, emoji);
    router.push(`/trip/${id}`);
  };

  return (
    <HydrationGate>
      <div className="min-h-screen grid place-items-center p-8">
        <div className="max-w-lg w-full">
          <div className="stamp text-xs text-orange mb-2">— Begin a new journey —</div>
          <h1 className="display text-5xl mb-8">Plot your next trip.</h1>

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

            <div className="pt-4 flex gap-3">
              <button onClick={onSubmit} disabled={!canSubmit} className="btn-poster disabled:opacity-40 disabled:cursor-not-allowed">
                Start planning →
              </button>
              <button onClick={() => router.back()} className="btn-poster btn-poster-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </HydrationGate>
  );
}
