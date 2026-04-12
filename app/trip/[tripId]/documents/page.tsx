"use client";

import { use, useState } from "react";
import { useStore, newDocument } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { FileText, ExternalLink, Trash2, Plus } from "lucide-react";

export default function DocumentsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertDocument);
  const remove = useStore((s) => s.removeDocument);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  if (!trip) return null;

  const add = () => {
    if (!label.trim() || !url.trim()) return;
    upsert(tripId, newDocument(label.trim(), url.trim()));
    setLabel("");
    setUrl("");
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
        <button onClick={add} className="btn-poster"><Plus size={14} /> Save</button>
      </div>

      {trip.documents.length === 0 ? (
        <div className="stamp text-xs text-ink/50 text-center py-10">No documents filed yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trip.documents.map((d) => (
            <div key={d.id} className="border-2 border-ink bg-cream p-4 flex items-start gap-3" style={{ boxShadow: "3px 3px 0 var(--ink)" }}>
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
              </div>
              <button
                onClick={() => remove(tripId, d.id)}
                className="text-ink/60 hover:text-orange"
                aria-label="Remove document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
