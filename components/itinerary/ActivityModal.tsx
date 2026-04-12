"use client";

import { useState, useEffect } from "react";
import type { Activity, Category, Link as TripLink } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { useStore, newLink } from "@/lib/store";
import { TimeSelect } from "@/components/ui/TimeSelect";
import { X, Link2, Plus, Trash2 } from "lucide-react";

interface Props {
  tripId: string;
  initial: Activity;
  onClose: () => void;
  isNew: boolean;
}

export function ActivityModal({ tripId, initial, onClose, isNew }: Props) {
  const upsertActivity = useStore((s) => s.upsertActivity);
  const removeActivity = useStore((s) => s.removeActivity);
  const [draft, setDraft] = useState<Activity>(initial);
  const [linksOpen, setLinksOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const update = <K extends keyof Activity>(key: K, value: Activity[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    if (!draft.title.trim()) return;
    upsertActivity(tripId, { ...draft, updatedAt: new Date().toISOString() });
    onClose();
  };

  const remove = () => {
    if (confirm("Delete this activity?")) {
      removeActivity(tripId, draft.id);
      onClose();
    }
  };

  const addLink = () => update("links", [...draft.links, newLink("", "")]);
  const updateLink = (id: string, patch: Partial<TripLink>) =>
    update("links", draft.links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLink = (id: string) => update("links", draft.links.filter((l) => l.id !== id));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="stamp text-[10px] text-orange">— {isNew ? "New entry" : "Edit entry"} —</div>
            <h2 className="display text-2xl">{isNew ? "Add an activity" : "Edit activity"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-dark border-2 border-ink">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label">Title</label>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Eiffel Tower summit"
              className="field-input"
            />
          </div>

          <div>
            <label className="field-label">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
              placeholder="Sunset tickets for the top floor…"
              className="field-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Category</label>
              <select
                value={draft.category}
                onChange={(e) => update("category", e.target.value as Category)}
                className="field-input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Cost</label>
              <input
                type="number"
                min={0}
                value={draft.cost}
                onChange={(e) => update("cost", Number(e.target.value) || 0)}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Location</label>
            <input
              value={draft.location.label}
              onChange={(e) => update("location", { ...draft.location, label: e.target.value })}
              placeholder="Champ de Mars, Paris"
              className="field-input"
            />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
                type="number"
                step="0.0001"
                value={draft.location.lat ?? ""}
                onChange={(e) =>
                  update("location", {
                    ...draft.location,
                    lat: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Latitude (optional)"
                className="field-input text-xs"
              />
              <input
                type="number"
                step="0.0001"
                value={draft.location.lng ?? ""}
                onChange={(e) =>
                  update("location", {
                    ...draft.location,
                    lng: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="Longitude (optional)"
                className="field-input text-xs"
              />
            </div>
            <div className="stamp text-[9px] text-ink/50 mt-1">Lat/lng power the map view.</div>
          </div>

          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => update("date", e.target.value)}
              className="field-input max-w-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Start time</label>
              <TimeSelect value={draft.startTime} onChange={(v) => update("startTime", v)} />
            </div>
            <div>
              <label className="field-label">End time</label>
              <TimeSelect value={draft.endTime} onChange={(v) => update("endTime", v)} />
            </div>
          </div>

          <div>
            <label className="field-label">Planning requirements</label>
            <textarea
              value={draft.planningNotes}
              onChange={(e) => update("planningNotes", e.target.value)}
              rows={2}
              placeholder="Book 2 weeks ahead, photo ID required…"
              className="field-input resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label mb-0">Links ({draft.links.length})</label>
              <button
                type="button"
                onClick={() => setLinksOpen((o) => !o)}
                className="btn-poster btn-poster-sm btn-poster-secondary"
              >
                <Link2 size={12} /> {linksOpen ? "Close" : "Add link"}
              </button>
            </div>
            {linksOpen && (
              <div className="border-2 border-ink p-3 bg-cream space-y-2">
                {draft.links.length === 0 && (
                  <div className="stamp text-[10px] text-teal-dark">No links yet.</div>
                )}
                {draft.links.map((l) => (
                  <div key={l.id} className="flex gap-2 items-center">
                    <input
                      value={l.label}
                      onChange={(e) => updateLink(l.id, { label: e.target.value })}
                      placeholder="Label (e.g. Booking confirmation)"
                      className="field-input flex-1"
                    />
                    <input
                      value={l.url}
                      onChange={(e) => updateLink(l.id, { url: e.target.value })}
                      placeholder="https://"
                      className="field-input flex-[1.3]"
                    />
                    <button
                      onClick={() => removeLink(l.id)}
                      className="p-2 border-2 border-ink hover:bg-orange hover:text-cream"
                      aria-label="Remove link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addLink} className="stamp text-[10px] flex items-center gap-1 text-teal-dark hover:text-orange">
                  <Plus size={12} /> Add another
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!isNew ? (
            <button onClick={remove} className="stamp text-xs text-orange hover:underline">
              <Trash2 size={12} className="inline mr-1" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-poster btn-poster-secondary">Cancel</button>
            <button onClick={save} disabled={!draft.title.trim()} className="btn-poster disabled:opacity-40">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
