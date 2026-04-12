"use client";

import type { ActivityProposal } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { MapPin, Clock, Calendar, Check, Edit3, CheckSquare, FileText, Luggage, Link2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatLat, formatLng } from "@/lib/coords";

interface Props {
  proposal: ActivityProposal;
  status: "pending_review" | "accepted" | "rejected";
  currency: string;
  onAccept: () => void;
  onRevise: () => void;
}

export function ActivityProposalCard({ proposal, status, currency, onAccept, onRevise }: Props) {
  const category = (CATEGORY_META as Record<string, (typeof CATEGORY_META)[keyof typeof CATEGORY_META]>)[
    proposal.category
  ] ?? CATEGORY_META.Activities;
  const Icon = category.icon;

  return (
    <div
      className="mt-3 border-2 border-ink bg-cream"
      style={{ boxShadow: "4px 4px 0 var(--ink)" }}
    >
      <div className="flex">
        <div
          className="w-2 shrink-0 border-r-2 border-dashed border-ink"
          style={{ background: category.color }}
        />
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="chip"
                  style={{
                    background: category.color,
                    color: "#f4ebd3",
                    borderColor: category.color,
                  }}
                >
                  <Icon size={10} /> {category.label}
                </span>
                {proposal.start_time && (
                  <span className="stamp text-[10px] text-teal-dark flex items-center gap-1">
                    <Clock size={10} /> {proposal.start_time}
                    {proposal.end_time && ` – ${proposal.end_time}`}
                  </span>
                )}
                <span className="stamp text-[10px] text-teal-dark flex items-center gap-1">
                  <Calendar size={10} /> {proposal.date}
                </span>
              </div>
              <h3 className="display text-lg leading-tight text-ink">{proposal.title}</h3>
            </div>
            <div className="display text-orange text-lg shrink-0">
              {formatCurrency(proposal.cost_per_person, proposal.currency ?? currency)}
            </div>
          </div>

          <p className="text-xs text-ink/80 leading-snug mb-2">{proposal.description}</p>

          <div className="space-y-1 mb-3">
            {proposal.location.label && (
              <div className="flex items-center gap-1 text-[11px] text-ink/70">
                <MapPin size={10} /> {proposal.location.label}
                {typeof proposal.location.lat === "number" && typeof proposal.location.lng === "number" && (
                  <span className="stamp text-[9px] text-teal-dark ml-1">
                    ({formatLat(proposal.location.lat)}, {formatLng(proposal.location.lng)})
                  </span>
                )}
              </div>
            )}
            {proposal.linked_tasks && proposal.linked_tasks.length > 0 && (
              <div className="text-[11px] text-ink/80">
                <div className="flex items-center gap-1 stamp text-[9px] text-teal-dark">
                  <CheckSquare size={9} /> Tasks ({proposal.linked_tasks.length})
                </div>
                <ul className="pl-4 list-disc">
                  {proposal.linked_tasks.map((t, i) => (
                    <li key={i}>
                      {t.label}
                      {t.due_date && <span className="stamp text-[9px] text-teal-dark ml-1">· due {t.due_date}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.linked_documents && proposal.linked_documents.length > 0 && (
              <div className="text-[11px] text-ink/80">
                <div className="flex items-center gap-1 stamp text-[9px] text-teal-dark">
                  <FileText size={9} /> Documents ({proposal.linked_documents.length})
                </div>
                <ul className="pl-4 list-disc">
                  {proposal.linked_documents.map((d, i) => (
                    <li key={i}>{d.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.linked_packing && proposal.linked_packing.length > 0 && (
              <div className="text-[11px] text-ink/80">
                <div className="flex items-center gap-1 stamp text-[9px] text-teal-dark">
                  <Luggage size={9} /> Pack ({proposal.linked_packing.length})
                </div>
                <ul className="pl-4 list-disc">
                  {proposal.linked_packing.map((p, i) => (
                    <li key={i}>
                      {p.label}
                      {p.category && <span className="stamp text-[9px] text-teal-dark ml-1">· {p.category}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposal.source_citations && proposal.source_citations.length > 0 && (
              <div className="text-[10px] text-ink/50 flex items-center gap-1 flex-wrap">
                <Link2 size={9} /> Sources:{" "}
                {proposal.source_citations.map((c, i) => (
                  <a
                    key={i}
                    href={c}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-orange"
                  >
                    [{i + 1}]
                  </a>
                ))}
              </div>
            )}
          </div>

          {status === "pending_review" && (
            <div className="flex gap-2">
              <button onClick={onAccept} className="btn-poster btn-poster-sm">
                <Check size={12} /> Add to itinerary
              </button>
              <button onClick={onRevise} className="btn-poster btn-poster-sm btn-poster-secondary">
                <Edit3 size={12} /> Revise
              </button>
            </div>
          )}
          {status === "accepted" && (
            <div className="stamp text-[10px] text-teal flex items-center gap-1">
              <Check size={10} /> Added to itinerary
            </div>
          )}
          {status === "rejected" && (
            <div className="stamp text-[10px] text-ink/50">Dismissed</div>
          )}
        </div>
      </div>
    </div>
  );
}
