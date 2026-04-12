"use client";

import { use, useMemo, useState } from "react";
import { useStore, newLeg } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { compareDateTime } from "@/lib/date";
import { TRAVEL_MODE_META } from "@/lib/travelModes";
import { TRAVEL_MODES, type TravelLeg, type TravelMode, type Activity } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";
import { TimeSelect } from "@/components/ui/TimeSelect";
import { Plus, X, Trash2 } from "lucide-react";

export default function TravelPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);
  const upsert = useStore((s) => s.upsertLeg);
  const remove = useStore((s) => s.removeLeg);
  const [editing, setEditing] = useState<TravelLeg | null>(null);

  const ordered = useMemo(() => {
    if (!trip) return [];
    return [...trip.activities].sort(compareDateTime);
  }, [trip]);

  if (!trip) return null;

  const findLeg = (fromId: string, toId: string) =>
    trip.travelLegs.find((l) => l.fromActivityId === fromId && l.toActivityId === toId);

  const openNew = (fromId: string, toId: string) => {
    const existing = findLeg(fromId, toId);
    setEditing(existing ?? newLeg(fromId, toId));
  };

  const totalCost = trip.travelLegs.reduce((s, l) => s + l.cost, 0);
  const modesUsed = Array.from(new Set(trip.travelLegs.map((l) => l.mode)));

  return (
    <div>
      <PosterHeader trip={trip} subtitle="How you'll get from one stop to the next." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Total travel cost" value={formatCurrency(totalCost, trip.currency)} />
        <Stat label="Legs planned" value={`${trip.travelLegs.length} / ${Math.max(0, ordered.length - 1)}`} />
        <Stat label="Modes used" value={modesUsed.length === 0 ? "—" : modesUsed.join(", ")} />
      </div>

      {ordered.length < 2 ? (
        <div className="border-2 border-dashed border-ink/30 p-6 text-center stamp text-xs text-teal-dark">
          Add at least two activities to plan travel between them.
        </div>
      ) : (
        <div className="space-y-1">
          {ordered.map((a, i) => {
            const next = ordered[i + 1];
            return (
              <div key={a.id}>
                <ActivityNode activity={a} />
                {next && (
                  <LegGap
                    leg={findLeg(a.id, next.id)}
                    onEdit={() => openNew(a.id, next.id)}
                    currency={trip.currency}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <LegModal
          leg={editing}
          trip={trip}
          onSave={(leg) => {
            upsert(tripId, leg);
            setEditing(null);
          }}
          onDelete={() => {
            remove(tripId, editing.id);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-ink bg-cream p-4" style={{ boxShadow: "3px 3px 0 var(--teal)" }}>
      <div className="stamp text-[10px] text-teal-dark">{label}</div>
      <div className="display text-2xl mt-1">{value}</div>
    </div>
  );
}

function ActivityNode({ activity }: { activity: Activity }) {
  const meta = CATEGORY_META[activity.category];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 p-3 border-2 border-ink bg-cream" style={{ boxShadow: "3px 3px 0 var(--ink)" }}>
      <div className="w-9 h-9 grid place-items-center border-2 border-ink" style={{ background: meta.color, color: "#f4ebd3" }}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold leading-tight truncate">{activity.title}</div>
        <div className="stamp text-[10px] text-teal-dark">
          {activity.date} {activity.startTime ? `· ${activity.startTime}` : ""} · {activity.location.label || "—"}
        </div>
      </div>
    </div>
  );
}

function LegGap({ leg, onEdit, currency }: { leg: TravelLeg | undefined; onEdit: () => void; currency: string }) {
  if (!leg) {
    return (
      <div className="pl-6 py-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 stamp text-xs text-ink/60 hover:text-orange border-l-2 border-dashed border-ink/40 pl-4 py-1"
        >
          <Plus size={12} /> Add travel leg
        </button>
      </div>
    );
  }
  const meta = TRAVEL_MODE_META[leg.mode];
  const Icon = meta.icon;
  return (
    <div className="pl-6 py-2">
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-3 border-l-2 border-dashed border-ink/40 pl-4 py-2 hover:bg-cream-dark text-left"
      >
        <div className="w-8 h-8 grid place-items-center border-2 border-ink bg-cream">
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="stamp text-xs text-teal-dark">{leg.mode}</div>
          <div className="text-sm truncate">
            {leg.details.carrier ?? "—"}
            {leg.details.confirmationNumber && ` · ${leg.details.confirmationNumber}`}
          </div>
        </div>
        <div className="display text-orange text-lg">{formatCurrency(leg.cost, currency)}</div>
      </button>
    </div>
  );
}

function LegModal({
  leg,
  trip,
  onSave,
  onDelete,
  onClose,
}: {
  leg: TravelLeg;
  trip: { activities: Activity[]; travelLegs: TravelLeg[] };
  onSave: (leg: TravelLeg) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<TravelLeg>(leg);
  const from = trip.activities.find((a) => a.id === leg.fromActivityId);
  const to = trip.activities.find((a) => a.id === leg.toActivityId);
  const exists = trip.travelLegs.some((l) => l.id === leg.id);

  const upd = <K extends keyof TravelLeg>(k: K, v: TravelLeg[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const updDetails = (k: keyof TravelLeg["details"], v: string | undefined) =>
    setDraft((d) => ({ ...d, details: { ...d.details, [k]: v && v.length > 0 ? v : undefined } }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="stamp text-[10px] text-orange">— Travel leg —</div>
            <h2 className="display text-2xl">{from?.title} → {to?.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-dark border-2 border-ink">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="field-label">Mode</label>
            <div className="flex gap-2 flex-wrap">
              {TRAVEL_MODES.map((m) => {
                const Icon = TRAVEL_MODE_META[m].icon;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => upd("mode", m)}
                    className={`flex items-center gap-2 px-3 py-2 border-2 border-ink ${draft.mode === m ? "bg-ink text-cream" : "bg-cream hover:bg-cream-dark"}`}
                  >
                    <Icon size={14} />
                    <span className="stamp text-xs">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Cost</label>
              <input
                type="number"
                min={0}
                value={draft.cost}
                onChange={(e) => upd("cost", Number(e.target.value) || 0)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Carrier / operator</label>
              <input
                value={draft.details.carrier ?? ""}
                onChange={(e) => updDetails("carrier", e.target.value)}
                placeholder="Air France"
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Confirmation #</label>
            <input
              value={draft.details.confirmationNumber ?? ""}
              onChange={(e) => updDetails("confirmationNumber", e.target.value)}
              className="field-input max-w-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Depart time</label>
              <TimeSelect value={draft.details.departTime} onChange={(v) => updDetails("departTime", v)} />
            </div>
            <div>
              <label className="field-label">Arrive time</label>
              <TimeSelect value={draft.details.arriveTime} onChange={(v) => updDetails("arriveTime", v)} />
            </div>
          </div>

          <div>
            <label className="field-label">Planning notes</label>
            <textarea
              value={draft.planningNotes}
              onChange={(e) => upd("planningNotes", e.target.value)}
              rows={2}
              placeholder="Gate 31C, arrive 2h early…"
              className="field-input resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {exists ? (
            <button onClick={onDelete} className="stamp text-xs text-orange hover:underline">
              <Trash2 size={12} className="inline mr-1" /> Delete leg
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-poster btn-poster-secondary">Cancel</button>
            <button onClick={() => onSave(draft)} className="btn-poster">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
