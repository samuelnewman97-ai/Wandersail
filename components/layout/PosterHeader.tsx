"use client";

import type { Trip } from "@/lib/types";
import { fmtLongDate, tripDayCount } from "@/lib/date";

export function PosterHeader({ trip, subtitle }: { trip: Trip; subtitle?: string }) {
  const days = tripDayCount(trip.startDate, trip.endDate);
  return (
    <header className="relative border-b-4 border-ink pb-6 mb-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="stamp text-xs text-orange mb-2">— A Wandersail Journey —</div>
          <h1 className="display text-5xl md:text-6xl text-ink">
            {trip.name}
          </h1>
          <div className="flex items-baseline gap-4 mt-3 flex-wrap">
            <div className="stamp text-xs text-teal-dark">
              {fmtLongDate(trip.startDate)} — {fmtLongDate(trip.endDate)}
            </div>
            <div className="stamp text-xs text-ink">· {days} {days === 1 ? "day" : "days"}</div>
          </div>
          {subtitle && <div className="mt-3 text-sm text-ink/70 italic">{subtitle}</div>}
        </div>
        <div className="text-7xl leading-none" aria-hidden>{trip.coverEmoji}</div>
      </div>
    </header>
  );
}
