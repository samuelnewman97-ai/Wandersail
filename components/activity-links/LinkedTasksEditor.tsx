"use client";

import { useState } from "react";
import { useStore, newTask } from "@/lib/store";
import type { Task } from "@/lib/types";
import { Check, Trash2, Plus } from "lucide-react";

interface Props {
  tripId: string;
  activityId: string;
  /** When true, changes write directly to the store. When false, we stage them
   *  in a local array and the parent reads via getStagedTasks() after mount. */
  stage?: boolean;
}

export function LinkedTasksEditor({ tripId, activityId }: Props) {
  const tasks = useStore((s) => s.trips[tripId]?.tasks ?? []);
  const upsert = useStore((s) => s.upsertTask);
  const toggle = useStore((s) => s.toggleTask);
  const remove = useStore((s) => s.removeTask);

  const [label, setLabel] = useState("");
  const [due, setDue] = useState("");

  const linked = tasks.filter((t) => t.linkedActivityId === activityId);

  const add = () => {
    if (!label.trim()) return;
    upsert(tripId, newTask(label.trim(), due || undefined, activityId));
    setLabel("");
    setDue("");
  };

  const patch = (task: Task, changes: Partial<Task>) => upsert(tripId, { ...task, ...changes });

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {linked.map((t) => (
          <li key={t.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(tripId, t.id)}
              className="w-5 h-5 border-2 border-ink bg-cream grid place-items-center shrink-0"
              aria-label={t.done ? "Mark incomplete" : "Mark complete"}
              type="button"
            >
              {t.done && <Check size={11} className="text-orange" />}
            </button>
            <input
              value={t.label}
              onChange={(e) => patch(t, { label: e.target.value })}
              className={`field-input flex-1 text-sm py-1 ${t.done ? "line-through text-ink/40" : ""}`}
            />
            <input
              type="date"
              value={t.dueDate ?? ""}
              onChange={(e) => patch(t, { dueDate: e.target.value || undefined })}
              className="field-input w-36 text-xs py-1"
            />
            <button
              type="button"
              onClick={() => remove(tripId, t.id)}
              className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity"
              aria-label="Delete task"
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
          placeholder="Add a task…"
          className="field-input flex-1 text-sm py-1"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="field-input w-36 text-xs py-1"
        />
        <button type="button" onClick={add} className="btn-poster btn-poster-sm">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
