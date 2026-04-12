"use client";

import { useState } from "react";
import { useStore, newPackingItem } from "@/lib/store";
import type { PackingItem } from "@/lib/types";
import { Check, Trash2, Plus } from "lucide-react";

interface Props {
  tripId: string;
  activityId: string;
}

export function LinkedPackingEditor({ tripId, activityId }: Props) {
  const items = useStore((s) => s.trips[tripId]?.packing ?? []);
  const upsert = useStore((s) => s.upsertPacking);
  const toggle = useStore((s) => s.togglePacking);
  const remove = useStore((s) => s.removePacking);

  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");

  const linked = items.filter((p) => p.linkedActivityId === activityId);

  const add = () => {
    if (!label.trim()) return;
    upsert(tripId, newPackingItem(label.trim(), category.trim() || "General", activityId));
    setLabel("");
    setCategory("");
  };

  const patch = (item: PackingItem, changes: Partial<PackingItem>) =>
    upsert(tripId, { ...item, ...changes });

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {linked.map((p) => (
          <li key={p.id} className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={() => toggle(tripId, p.id)}
              className="w-5 h-5 border-2 border-ink bg-cream grid place-items-center shrink-0"
              aria-label={p.packed ? "Mark unpacked" : "Mark packed"}
            >
              {p.packed && <Check size={11} className="text-orange" />}
            </button>
            <input
              value={p.label}
              onChange={(e) => patch(p, { label: e.target.value })}
              className={`field-input flex-1 text-sm py-1 ${p.packed ? "line-through text-ink/40" : ""}`}
            />
            <input
              value={p.category}
              onChange={(e) => patch(p, { category: e.target.value })}
              placeholder="Category"
              className="field-input w-28 text-xs py-1"
            />
            <button
              type="button"
              onClick={() => remove(tripId, p.id)}
              className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity"
              aria-label="Delete item"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a packing item…"
          className="field-input flex-1 text-sm py-1"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="field-input w-28 text-xs py-1"
        />
        <button type="button" onClick={add} className="btn-poster btn-poster-sm">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
