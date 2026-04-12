"use client";

import type { Activity } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { MapPin, Clock, Link2, Sticker } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  activity: Activity;
  currency: string;
  onClick: () => void;
}

export function ActivityCard({ activity, currency, onClick }: Props) {
  const meta = CATEGORY_META[activity.category];
  const Icon = meta.icon;
  const timeRange = activity.startTime
    ? activity.endTime
      ? `${activity.startTime} – ${activity.endTime}`
      : activity.startTime
    : null;

  return (
    <button
      onClick={onClick}
      className="ticket-card w-full text-left flex p-0 cursor-pointer"
      style={{ transform: `rotate(${(((activity.id.charCodeAt(0) % 5) - 2) * 0.15).toFixed(2)}deg)` }}
    >
      <div
        className="w-2 shrink-0 border-r-2 border-dashed border-ink"
        style={{ background: meta.color }}
      />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="chip" style={{ background: meta.color, color: "#f4ebd3", borderColor: meta.color }}>
                <Icon size={11} /> {meta.label}
              </span>
              {timeRange && (
                <span className="stamp text-[10px] text-teal-dark flex items-center gap-1">
                  <Clock size={10} /> {timeRange}
                </span>
              )}
            </div>
            <h3 className="display text-xl leading-tight text-ink">{activity.title}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="display text-lg text-orange">{formatCurrency(activity.cost, currency)}</div>
          </div>
        </div>

        {activity.description && (
          <p className="text-sm text-ink/80 leading-snug mb-2 line-clamp-2">{activity.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-ink/70 flex-wrap">
          {activity.location.label && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {activity.location.label}
            </span>
          )}
          {activity.links.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 size={11} /> {activity.links.length} {activity.links.length === 1 ? "link" : "links"}
            </span>
          )}
          {activity.planningNotes && (
            <span className="flex items-center gap-1 text-orange">
              <Sticker size={11} /> Has planning notes
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
