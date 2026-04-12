"use client";

import { use, useState, useMemo } from "react";
import { useStore, newPackingItem } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { Plus, Check, Trash2 } from "lucide-react";

export default function PackingPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertPacking);
  const toggle = useStore((s) => s.togglePacking);
  const remove = useStore((s) => s.removePacking);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Clothes");

  const grouped = useMemo(() => {
    if (!trip) return {};
    const map: Record<string, typeof trip.packing> = {};
    trip.packing.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [trip]);

  if (!trip) return null;

  const packed = trip.packing.filter((p) => p.packed).length;
  const progress = trip.packing.length === 0 ? 0 : Math.round((packed / trip.packing.length) * 100);

  const add = () => {
    if (!label.trim()) return;
    upsert(tripId, newPackingItem(label.trim(), category || "General"));
    setLabel("");
  };

  return (
    <div>
      <PosterHeader trip={trip} subtitle={`${packed} / ${trip.packing.length} items packed`} />

      <div className="mb-6">
        <div className="h-4 border-2 border-ink bg-cream">
          <div className="h-full bg-orange" style={{ width: `${progress}%` }} />
        </div>
        <div className="stamp text-[10px] text-teal-dark mt-1">{progress}% packed</div>
      </div>

      <div className="mb-8 flex gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add item…"
          className="field-input flex-[2]"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="field-input flex-1"
        />
        <button onClick={add} className="btn-poster">
          <Plus size={14} /> Add
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="display text-2xl text-teal-dark mb-3">{cat}</h2>
            <ul className="space-y-2">
              {items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() => toggle(tripId, p.id)}
                    className="w-6 h-6 border-2 border-ink bg-cream grid place-items-center shrink-0"
                    aria-label={p.packed ? "Mark unpacked" : "Mark packed"}
                  >
                    {p.packed && <Check size={14} className="text-orange" />}
                  </button>
                  <span className={`flex-1 ${p.packed ? "line-through text-ink/40" : ""}`}>{p.label}</span>
                  <button
                    onClick={() => remove(tripId, p.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {trip.packing.length === 0 && (
          <div className="stamp text-xs text-ink/50 text-center py-10">Nothing packed yet.</div>
        )}
      </div>
    </div>
  );
}
