"use client";

import { use, useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { daysBetween, fmtDayHeader, compareDateTime, shiftDay } from "@/lib/date";
import { CATEGORY_META } from "@/lib/categories";
import { ActivityModal } from "@/components/itinerary/ActivityModal";
import type { Activity } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type View = "day" | "week" | "all";

export default function CalendarPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const [view, setView] = useState<View>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Activity | null>(null);

  const firstDay = trip?.startDate ?? null;
  const day = cursor ?? firstDay;

  const grouped = useMemo(() => {
    if (!trip) return {} as Record<string, Activity[]>;
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

  if (!trip || !day) return null;

  return (
    <div>
      <PosterHeader trip={trip} subtitle="Your days, scheduled." />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex border-2 border-ink">
          {(["day", "week", "all"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`stamp text-xs px-4 py-2 ${view === v ? "bg-ink text-cream" : "bg-cream hover:bg-cream-dark"}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view !== "all" && (
          <div className="flex items-center gap-2 ml-2">
            <button onClick={() => setCursor(shiftDay(day, view === "week" ? -7 : -1))} className="p-2 border-2 border-ink bg-cream hover:bg-cream-dark">
              <ChevronLeft size={14} />
            </button>
            <div className="stamp text-xs px-2">{fmtDayHeader(day)}</div>
            <button onClick={() => setCursor(shiftDay(day, view === "week" ? 7 : 1))} className="p-2 border-2 border-ink bg-cream hover:bg-cream-dark">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {view === "all" && <AgendaView grouped={grouped} currency={trip.currency} onEdit={setEditing} />}
      {view === "day" && <DayView date={day} activities={grouped[day] ?? []} currency={trip.currency} onEdit={setEditing} />}
      {view === "week" && <WeekView anchorDate={day} grouped={grouped} currency={trip.currency} onEdit={setEditing} />}

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

function AgendaView({
  grouped,
  currency,
  onEdit,
}: {
  grouped: Record<string, Activity[]>;
  currency: string;
  onEdit: (a: Activity) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, acts], i) => (
        <div key={date}>
          <div className="flex items-baseline gap-3 mb-2 pb-1 border-b-2 border-dashed border-ink/40">
            <div className="display text-2xl text-teal-dark">Day {i + 1}</div>
            <div className="stamp text-xs text-ink">{fmtDayHeader(date)}</div>
          </div>
          {acts.length === 0 ? (
            <div className="stamp text-xs text-ink/50 py-2">— free day —</div>
          ) : (
            <ul className="divide-y divide-dashed divide-ink/30">
              {acts.map((a) => {
                const meta = CATEGORY_META[a.category];
                return (
                  <li key={a.id}>
                    <button onClick={() => onEdit(a)} className="w-full py-3 flex items-center gap-4 text-left hover:bg-cream-dark px-2">
                      <div className="stamp text-xs text-teal-dark w-24 shrink-0">
                        {a.startTime ?? "—"}{a.endTime ? ` – ${a.endTime}` : ""}
                      </div>
                      <div className="w-3 h-3 shrink-0 border border-ink" style={{ background: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{a.title}</div>
                        {a.location.label && <div className="text-xs text-ink/60 truncate">{a.location.label}</div>}
                      </div>
                      <div className="display text-orange text-lg shrink-0">{formatCurrency(a.cost, currency)}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function DayView({
  date,
  activities,
  currency,
  onEdit,
}: {
  date: string;
  activities: Activity[];
  currency: string;
  onEdit: (a: Activity) => void;
}) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6am – 23
  return (
    <div className="border-2 border-ink bg-cream" style={{ boxShadow: "4px 4px 0 var(--teal)" }}>
      <div className="p-3 border-b-2 border-ink">
        <div className="stamp text-xs text-teal-dark">{fmtDayHeader(date)}</div>
      </div>
      <div className="relative" style={{ height: `${hours.length * 56}px` }}>
        {hours.map((h, i) => (
          <div key={h} className="absolute left-0 right-0 border-t border-dashed border-ink/20 flex" style={{ top: i * 56 }}>
            <div className="stamp text-[10px] text-ink/50 w-12 pt-1 pl-2">{String(h).padStart(2, "0")}:00</div>
          </div>
        ))}
        {activities.map((a) => {
          if (!a.startTime) return null;
          const [sh, sm] = a.startTime.split(":").map(Number);
          const [eh, em] = (a.endTime ?? `${sh + 1}:${String(sm).padStart(2, "0")}`).split(":").map(Number);
          const top = ((sh + sm / 60) - 6) * 56;
          const height = Math.max(32, ((eh + em / 60) - (sh + sm / 60)) * 56);
          if (top < 0) return null;
          const meta = CATEGORY_META[a.category];
          return (
            <button
              key={a.id}
              onClick={() => onEdit(a)}
              className="absolute left-14 right-4 border-2 border-ink text-left p-2 overflow-hidden"
              style={{ top, height, background: meta.color, color: "#f4ebd3", boxShadow: "3px 3px 0 var(--ink)" }}
            >
              <div className="stamp text-[10px] opacity-90">{a.startTime}{a.endTime && ` – ${a.endTime}`}</div>
              <div className="font-bold text-sm leading-tight truncate">{a.title}</div>
              <div className="text-[10px] opacity-80">{formatCurrency(a.cost, currency)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  anchorDate,
  grouped,
  currency,
  onEdit,
}: {
  anchorDate: string;
  grouped: Record<string, Activity[]>;
  currency: string;
  onEdit: (a: Activity) => void;
}) {
  // Show 7 days starting from anchorDate
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(anchorDate, i));
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const acts = grouped[d] ?? [];
        return (
          <div key={d} className="border-2 border-ink bg-cream min-h-64 p-2" style={{ boxShadow: "2px 2px 0 var(--ink)" }}>
            <div className="stamp text-[10px] text-teal-dark border-b border-dashed border-ink/30 pb-1 mb-2">
              {fmtDayHeader(d)}
            </div>
            <div className="space-y-1">
              {acts.map((a) => {
                const meta = CATEGORY_META[a.category];
                return (
                  <button
                    key={a.id}
                    onClick={() => onEdit(a)}
                    className="w-full text-left p-1.5 border border-ink text-[11px]"
                    style={{ background: meta.color, color: "#f4ebd3" }}
                  >
                    <div className="opacity-80">{a.startTime ?? "—"}</div>
                    <div className="font-bold truncate">{a.title}</div>
                  </button>
                );
              })}
              {acts.length === 0 && <div className="stamp text-[9px] text-ink/40 text-center pt-4">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
