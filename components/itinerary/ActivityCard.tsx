"use client";

import type { Activity } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { MapPin, Link2, Calendar, CheckSquare, FileText, Luggage } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { InlineTimePopover } from "./InlineTimePopover";

interface Props {
  activity: Activity;
  tripId: string;
  currency: string;
  onClick: () => void;
}

export function ActivityCard({ activity, tripId, currency, onClick }: Props) {
  const meta = CATEGORY_META[activity.category];
  const Icon = meta.icon;

  const upsertActivity = useStore((s) => s.upsertActivity);

  // Counts of linked items for the footer chips
  const linkedTaskCount = useStore(
    (s) =>
      s.trips[tripId]?.tasks.filter((t) => t.linkedActivityId === activity.id).length ?? 0
  );
  const linkedDocCount = useStore(
    (s) => s.trips[tripId]?.documents.filter((d) => d.activityId === activity.id).length ?? 0
  );
  const linkedPackCount = useStore(
    (s) =>
      s.trips[tripId]?.packing.filter((p) => p.linkedActivityId === activity.id).length ?? 0
  );

  const updateTime = (startTime: string | undefined, endTime: string | undefined) => {
    upsertActivity(tripId, {
      ...activity,
      startTime,
      endTime,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateDate = (date: string) => {
    if (!date) return;
    upsertActivity(tripId, {
      ...activity,
      date,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="ticket-card w-full text-left flex p-0"
      style={{
        transform: `rotate(${(((activity.id.charCodeAt(0) % 5) - 2) * 0.15).toFixed(2)}deg)`,
      }}
    >
      <div
        className="w-2 shrink-0 border-r-2 border-dashed border-ink"
        style={{ background: meta.color }}
      />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="chip"
                style={{ background: meta.color, color: "#f4ebd3", borderColor: meta.color }}
              >
                <Icon size={11} /> {meta.label}
              </span>
              <InlineTimePopover
                startTime={activity.startTime}
                endTime={activity.endTime}
                onSave={updateTime}
              />
              <label
                className="stamp text-[10px] text-teal-dark hover:text-orange flex items-center gap-1 border border-dashed border-transparent hover:border-ink/40 px-1 py-0.5 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Calendar size={10} />
                <input
                  type="date"
                  value={activity.date}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateDate(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent outline-none stamp text-[10px] text-teal-dark cursor-pointer"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="display text-xl leading-tight text-ink text-left hover:text-orange transition-colors"
            >
              {activity.title || <span className="italic text-ink/40">Untitled</span>}
            </button>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="text-right shrink-0"
            aria-label="Edit activity"
          >
            <div className="display text-lg text-orange">
              {formatCurrency(activity.cost, currency)}
            </div>
          </button>
        </div>

        {activity.description && (
          <button
            type="button"
            onClick={onClick}
            className="block text-left w-full text-sm text-ink/80 leading-snug mb-2 line-clamp-2"
          >
            {activity.description}
          </button>
        )}

        <div className="flex items-center gap-3 text-xs text-ink/70 flex-wrap">
          {activity.location.label && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {activity.location.label}
            </span>
          )}
          {activity.links.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 size={11} /> {activity.links.length}
            </span>
          )}
          {linkedTaskCount > 0 && (
            <span className="flex items-center gap-1 text-teal-dark">
              <CheckSquare size={11} /> {linkedTaskCount}
            </span>
          )}
          {linkedDocCount > 0 && (
            <span className="flex items-center gap-1 text-teal-dark">
              <FileText size={11} /> {linkedDocCount}
            </span>
          )}
          {linkedPackCount > 0 && (
            <span className="flex items-center gap-1 text-teal-dark">
              <Luggage size={11} /> {linkedPackCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
