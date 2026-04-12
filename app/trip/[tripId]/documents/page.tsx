"use client";

import { use, useState } from "react";
import { useStore, newDocument } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { ActivityModal } from "@/components/itinerary/ActivityModal";
import type { Activity } from "@/lib/types";
import { FileText, ExternalLink, Trash2, Plus, Link2 } from "lucide-react";

export default function DocumentsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertDocument);
  const remove = useStore((s) => s.removeDocument);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState<Activity | null>(null);

  if (!trip) return null;

  const add = () => {
    if (!label.trim() || !url.trim()) return;
    upsert(tripId, newDocument(label.trim(), url.trim()));
    setLabel("");
    setUrl("");
  };

  const openActivity = (activityId: string) => {
    const act = trip.activities.find((a) => a.id === activityId);
    if (act) setEditing(act);
  };

  return (
    <div>
      <PosterHeader trip={trip} subtitle="Passports, tickets, confirmations — all in one pocket." />

      <div className="mb-8 grid grid-cols-[1fr_2fr_auto] gap-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Flight confirmation)"
          className="field-input"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="field-input"
        />
        <button onClick={add} className="btn-poster">
          <Plus size={14} /> Save
        </button>
      </div>

      {trip.documents.length === 0 ? (
        <div className="stamp text-xs text-ink/50 text-center py-10">No documents filed yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trip.documents.map((d) => {
            const activity = d.activityId
              ? trip.activities.find((a) => a.id === d.activityId)
              : null;
            return (
              <div
                key={d.id}
                className="border-2 border-ink bg-cream p-4 flex items-start gap-3"
                style={{ boxShadow: "3px 3px 0 var(--ink)" }}
              >
                <FileText className="shrink-0 text-teal" size={24} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{d.label}</div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stamp text-[10px] text-orange hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <ExternalLink size={10} /> Open
                  </a>
                  {activity && (
                    <button
                      onClick={() => openActivity(activity.id)}
                      className="stamp text-[9px] text-teal-dark hover:text-orange flex items-center gap-1 mt-1 truncate"
                    >
                      <Link2 size={9} /> from "{activity.title}"
                    </button>
                  )}
                </div>
                <button
                  onClick={() => remove(tripId, d.id)}
                  className="text-ink/60 hover:text-orange"
                  aria-label="Remove document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ActivityModal
          tripId={tripId}
          initial={editing}
          isNew={false}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
