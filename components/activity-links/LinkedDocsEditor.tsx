"use client";

import { useState } from "react";
import { useStore, newDocument } from "@/lib/store";
import type { DocumentRef } from "@/lib/types";
import { Trash2, Plus, ExternalLink } from "lucide-react";

interface Props {
  tripId: string;
  activityId: string;
}

export function LinkedDocsEditor({ tripId, activityId }: Props) {
  const docs = useStore((s) => s.trips[tripId]?.documents ?? []);
  const upsert = useStore((s) => s.upsertDocument);
  const remove = useStore((s) => s.removeDocument);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const linked = docs.filter((d) => d.activityId === activityId);

  const add = () => {
    if (!label.trim() || !url.trim()) return;
    upsert(tripId, newDocument(label.trim(), url.trim(), activityId));
    setLabel("");
    setUrl("");
  };

  const patch = (doc: DocumentRef, changes: Partial<DocumentRef>) =>
    upsert(tripId, { ...doc, ...changes });

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {linked.map((d) => (
          <li key={d.id} className="flex items-center gap-2 group">
            <input
              value={d.label}
              onChange={(e) => patch(d, { label: e.target.value })}
              placeholder="Label"
              className="field-input flex-1 text-sm py-1"
            />
            <input
              value={d.url}
              onChange={(e) => patch(d, { url: e.target.value })}
              placeholder="https://"
              className="field-input flex-[1.4] text-xs py-1"
            />
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink/60 hover:text-orange"
              aria-label="Open link"
            >
              <ExternalLink size={14} />
            </a>
            <button
              type="button"
              onClick={() => remove(tripId, d.id)}
              className="opacity-0 group-hover:opacity-100 text-ink/60 hover:text-orange transition-opacity"
              aria-label="Delete document"
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
          placeholder="Document label"
          className="field-input flex-1 text-sm py-1"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          className="field-input flex-[1.4] text-xs py-1"
        />
        <button type="button" onClick={add} className="btn-poster btn-poster-sm">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
