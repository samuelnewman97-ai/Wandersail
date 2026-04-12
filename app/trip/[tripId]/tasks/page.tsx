"use client";

import { use, useState } from "react";
import { useStore, newTask } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { isBeforeIso, isAfterIso } from "@/lib/date";
import { Check, Trash2, Plus } from "lucide-react";

export default function TasksPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertTask);
  const toggle = useStore((s) => s.toggleTask);
  const remove = useStore((s) => s.removeTask);
  const [newLabel, setNewLabel] = useState("");

  if (!trip) return null;

  const groups = {
    "Before trip": trip.tasks.filter((t) => !t.dueDate || isBeforeIso(t.dueDate, trip.startDate)),
    "During trip": trip.tasks.filter(
      (t) => t.dueDate && !isBeforeIso(t.dueDate, trip.startDate) && !isAfterIso(t.dueDate, trip.endDate)
    ),
    "After trip": trip.tasks.filter((t) => t.dueDate && isAfterIso(t.dueDate, trip.endDate)),
  };

  const add = () => {
    if (!newLabel.trim()) return;
    upsert(tripId, newTask(newLabel.trim()));
    setNewLabel("");
  };

  const remaining = trip.tasks.filter((t) => !t.done).length;

  return (
    <div>
      <PosterHeader
        trip={trip}
        subtitle={`${remaining} of ${trip.tasks.length} tasks remaining`}
      />

      <div className="mb-8 flex gap-3">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a planning task…"
          className="field-input flex-1"
        />
        <button onClick={add} className="btn-poster">
          <Plus size={14} /> Add task
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groups).map(([label, items]) => (
          <section key={label}>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="display text-2xl text-teal-dark">{label}</h2>
              <span className="stamp text-xs text-ink/60">
                {items.filter((t) => !t.done).length} open · {items.filter((t) => t.done).length} done
              </span>
            </div>
            {items.length === 0 ? (
              <div className="stamp text-xs text-ink/50 pl-2">— Nothing here —</div>
            ) : (
              <ul className="space-y-2">
                {items.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggle(tripId, t.id)}
                      className="w-6 h-6 border-2 border-ink bg-cream grid place-items-center shrink-0"
                      aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {t.done && <Check size={14} className="text-orange" />}
                    </button>
                    <span className={`flex-1 ${t.done ? "line-through text-ink/40" : ""}`}>{t.label}</span>
                    {t.dueDate && (
                      <span className="stamp text-[10px] text-teal-dark">{t.dueDate}</span>
                    )}
                    <button
                      onClick={() => remove(tripId, t.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity"
                      aria-label="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
