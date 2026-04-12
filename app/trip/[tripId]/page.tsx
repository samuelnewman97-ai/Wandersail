"use client";

import { use, useState, useMemo } from "react";
import { useStore, newActivity } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { ActivityCard } from "@/components/itinerary/ActivityCard";
import { ActivityModal } from "@/components/itinerary/ActivityModal";
import { fmtDayHeader, daysBetween, compareDateTime } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { Plus } from "lucide-react";

export default function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const [editing, setEditing] = useState<{ activity: Activity; isNew: boolean } | null>(null);

  const grouped = useMemo(() => {
    if (!trip) return {};
    const days = daysBetween(trip.startDate, trip.endDate);
    const map: Record<string, Activity[]> = {};
    days.forEach((d) => (map[d] = []));
    trip.activities.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.values(map).forEach((arr) => arr.sort(compareDateTime));
    return map;
  }, [trip]);

  if (!trip) return null;

  const totalCost = trip.activities.reduce((sum, a) => sum + a.cost, 0)
    + trip.travelLegs.reduce((sum, l) => sum + l.cost, 0);

  return (
    <div>
      <PosterHeader
        trip={trip}
        subtitle={`${trip.activities.length} activities plotted · ${formatCurrency(totalCost, trip.currency)} projected`}
      />

      <div className="space-y-10">
        {Object.entries(grouped).map(([date, acts], dayIdx) => (
          <section key={date}>
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-4">
                <div className="display text-3xl text-teal-dark">Day {dayIdx + 1}</div>
                <div className="stamp text-xs text-ink">— {fmtDayHeader(date)}</div>
              </div>
              <button
                onClick={() => setEditing({ activity: newActivity(date), isNew: true })}
                className="btn-poster btn-poster-sm"
              >
                <Plus size={14} /> Add activity
              </button>
            </div>

            {acts.length === 0 ? (
              <div className="border-2 border-dashed border-ink/30 p-6 text-center">
                <div className="stamp text-xs text-teal-dark">Nothing planned for this day yet.</div>
              </div>
            ) : (
              <div className="space-y-5 px-3">
                {acts.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    tripId={tripId}
                    currency={trip.currency}
                    onClick={() => setEditing({ activity: a, isNew: false })}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <ActivityModal
          tripId={tripId}
          initial={editing.activity}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
