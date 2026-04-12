"use client";

import { use, useState } from "react";
import { useStore, newTask } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { ActivityModal } from "@/components/itinerary/ActivityModal";
import { isBeforeIso, isAfterIso } from "@/lib/date";
import type { Activity } from "@/lib/types";
import { Check, Trash2, Plus, Link2 } from "lucide-react";

export default function TasksPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertTask);
  const toggle = useStore((s) => s.toggleTask);
  const remove = useStore((s) => s.removeTask);
  const [newLabel, setNewLabel] = useState("");
  const [newDue, setNewDue] = useState("");
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

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
    upsert(tripId, newTask(newLabel.trim(), newDue || undefined));
    setNewLabel("");
    setNewDue("");
  };

  const updateDue = (taskId: string, dueDate: string) => {
    const task = trip.tasks.find((t) => t.id === taskId);
    if (!task) return;
    upsert(tripId, { ...task, dueDate: dueDate || undefined });
  };

  const openActivityFor = (activityId: string) => {
    const act = trip.activities.find((a) => a.id === activityId);
    if (act) setEditingActivity(act);
  };

  const remaining = trip.tasks.filter((t) => !t.done).length;

  return (
    <div>
      <PosterHeader trip={trip} subtitle={`${remaining} of ${trip.tasks.length} tasks remaining`} />

      <div className="mb-8 flex gap-2 items-stretch flex-wrap">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a planning task…"
          className="field-input flex-1 min-w-48"
        />
        <input
          type="date"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="field-input w-36 shrink-0 text-xs"
          title="Due date determines which bucket this task goes in"
        />
        <button onClick={add} className="btn-poster shrink-0">
          <Plus size={14} /> Add
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
                  <li key={t.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggle(tripId, t.id)}
                      className="w-6 h-6 border-2 border-ink bg-cream grid place-items-center shrink-0"
                      aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {t.done && <Check size={14} className="text-orange" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`truncate ${t.done ? "line-through text-ink/40" : ""}`}>
                        {t.label}
                      </div>
                      {t.linkedActivityId && (
                        <button
                          onClick={() => openActivityFor(t.linkedActivityId!)}
                          className="stamp text-[9px] text-teal-dark hover:text-orange flex items-center gap-1 mt-0.5 truncate max-w-full"
                        >
                          <Link2 size={9} className="shrink-0" />
                          <span className="truncate">
                            from "
                            {trip.activities.find((a) => a.id === t.linkedActivityId)?.title ??
                              "deleted activity"}
                            "
                          </span>
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={t.dueDate ?? ""}
                      onChange={(e) => updateDue(t.id, e.target.value)}
                      className="field-input w-32 shrink-0 text-xs py-1"
                      title="Edit due date — moves the task between buckets"
                    />
                    <button
                      onClick={() => remove(tripId, t.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity shrink-0"
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

      {editingActivity && (
        <ActivityModal
          tripId={tripId}
          initial={editingActivity}
          isNew={false}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
