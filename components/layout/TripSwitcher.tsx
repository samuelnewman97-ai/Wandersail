"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { ChevronDown, Plus, Upload, Check } from "lucide-react";
import type { Trip } from "@/lib/types";

export function TripSwitcher({ activeTripId }: { activeTripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trips = useStore((s) => s.trips);
  const setActive = useStore((s) => s.setActiveTrip);
  const importTrip = useStore((s) => s.importTrip);

  const active = trips[activeTripId];
  const tripList = Object.values(trips);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (id: string) => {
    setActive(id);
    router.push(`/trip/${id}`);
    setOpen(false);
  };

  const onImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Trip;
        if (!parsed.name || !Array.isArray(parsed.activities)) throw new Error("Invalid trip file");
        const id = importTrip(parsed);
        router.push(`/trip/${id}`);
        setOpen(false);
      } catch (err) {
        alert("Could not import trip: " + (err as Error).message);
      }
    };
    input.click();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left bg-cream border-2 border-ink p-3 flex items-center gap-3 hover:bg-cream-dark transition"
        style={{ boxShadow: "3px 3px 0 var(--teal)" }}
      >
        <span className="text-2xl">{active?.coverEmoji ?? "✈️"}</span>
        <div className="flex-1 min-w-0">
          <div className="display text-sm leading-tight truncate">{active?.name ?? "No trip"}</div>
          <div className="stamp text-[9px] text-teal-dark mt-0.5">
            {active ? `${active.startDate} → ${active.endDate}` : "Create a trip"}
          </div>
        </div>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-cream border-2 border-ink z-30 max-h-80 overflow-y-auto"
          style={{ boxShadow: "4px 4px 0 var(--ink)" }}
        >
          {tripList.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className="w-full text-left p-3 flex items-center gap-3 hover:bg-cream-dark border-b border-dashed border-ink/30 last:border-b-0"
            >
              <span className="text-xl">{t.coverEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{t.name}</div>
                <div className="stamp text-[9px] text-teal-dark">{t.startDate} → {t.endDate}</div>
              </div>
              {t.id === activeTripId && <Check size={14} className="text-orange" />}
            </button>
          ))}
          <div className="border-t-2 border-ink">
            <button
              onClick={() => {
                router.push("/new-trip");
                setOpen(false);
              }}
              className="w-full p-3 flex items-center gap-2 stamp text-xs hover:bg-cream-dark"
            >
              <Plus size={14} /> New trip…
            </button>
            <button
              onClick={onImport}
              className="w-full p-3 flex items-center gap-2 stamp text-xs hover:bg-cream-dark border-t border-dashed border-ink/30"
            >
              <Upload size={14} /> Import JSON…
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
