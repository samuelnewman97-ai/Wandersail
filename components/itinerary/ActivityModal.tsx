"use client";

import { useState, useEffect } from "react";
import type { Activity, Category, Link as TripLink } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { useStore, newLink } from "@/lib/store";
import { TimeSelect } from "@/components/ui/TimeSelect";
import { LinkedTasksEditor } from "@/components/activity-links/LinkedTasksEditor";
import { LinkedDocsEditor } from "@/components/activity-links/LinkedDocsEditor";
import { LinkedPackingEditor } from "@/components/activity-links/LinkedPackingEditor";
import { parseCoordinates, formatLat, formatLng } from "@/lib/coords";
import { X, Link2, Plus, Trash2, MapPin, CheckSquare, FileText, Luggage } from "lucide-react";

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
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

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
                inputMode="decimal"
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

            <div className="mt-3 border-2 border-dashed border-ink/30 p-3 bg-cream-dark/40 space-y-2">
              <div className="stamp text-[10px] text-teal-dark flex items-center gap-1">
                <MapPin size={10} /> Coordinates (for map view)
              </div>

              <div className="flex gap-2">
                <input
                  value={pasteValue}
                  onChange={(e) => {
                    setPasteValue(e.target.value);
                    setPasteError(null);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    const parsed = parseCoordinates(text);
                    if (parsed) {
                      e.preventDefault();
                      update("location", { ...draft.location, lat: parsed.lat, lng: parsed.lng });
                      setPasteValue("");
                      setPasteError(null);
                    }
                  }}
                  placeholder='Paste from Google Maps: "21.3099, -157.8581"'
                  className="field-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseCoordinates(pasteValue);
                    if (parsed) {
                      update("location", { ...draft.location, lat: parsed.lat, lng: parsed.lng });
                      setPasteValue("");
                      setPasteError(null);
                    } else {
                      setPasteError("Couldn't parse those coordinates.");
                    }
                  }}
                  disabled={!pasteValue.trim()}
                  className="btn-poster btn-poster-sm disabled:opacity-40"
                >
                  Parse
                </button>
              </div>
              {pasteError && <div className="stamp text-[10px] text-orange">{pasteError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.0001"
                  inputMode="decimal"
                  value={draft.location.lat ?? ""}
                  onChange={(e) =>
                    update("location", {
                      ...draft.location,
                      lat: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Latitude"
                  className="field-input text-xs"
                />
                <input
                  type="number"
                  step="0.0001"
                  inputMode="decimal"
                  value={draft.location.lng ?? ""}
                  onChange={(e) =>
                    update("location", {
                      ...draft.location,
                      lng: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="Longitude"
                  className="field-input text-xs"
                />
              </div>

              {typeof draft.location.lat === "number" && typeof draft.location.lng === "number" ? (
                <div className="stamp text-[10px] text-teal-dark">
                  Current: {formatLat(draft.location.lat)}, {formatLng(draft.location.lng)}
                </div>
              ) : (
                <div className="stamp text-[10px] text-ink/50">
                  Tip: use negative values for West (Hawaii = -157.8) or South hemispheres.
                </div>
              )}
            </div>
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

          {/* Linked sub-items: tasks, documents, packing. These save directly to
              the store, so they're only available after the activity exists. */}
          {isNew ? (
            <div className="stamp text-[10px] text-ink/50 border-2 border-dashed border-ink/30 p-3 text-center">
              Save this activity to add linked planning tasks, documents, and packing items.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="field-label flex items-center gap-1">
                  <CheckSquare size={11} /> Planning tasks for this activity
                </label>
                <LinkedTasksEditor tripId={tripId} activityId={draft.id} />
              </div>
              <div>
                <label className="field-label flex items-center gap-1">
                  <FileText size={11} /> Related documents
                </label>
                <LinkedDocsEditor tripId={tripId} activityId={draft.id} />
              </div>
              <div>
                <label className="field-label flex items-center gap-1">
                  <Luggage size={11} /> Packing for this activity
                </label>
                <LinkedPackingEditor tripId={tripId} activityId={draft.id} />
              </div>
              <div className="stamp text-[9px] text-ink/40">
                Linked items save automatically as you edit them.
              </div>
            </div>
          )}

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
