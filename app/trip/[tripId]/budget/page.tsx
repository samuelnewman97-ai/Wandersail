"use client";

import { use, useMemo } from "react";
import { useStore } from "@/lib/store";
import { PosterHeader } from "@/components/layout/PosterHeader";
import { CATEGORY_META } from "@/lib/categories";
import { CATEGORIES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { daysBetween, fmtDayHeader, tripDayCount } from "@/lib/date";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function BudgetPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const trip = useStore((s) => s.trips[tripId]);

  const data = useMemo(() => {
    if (!trip) return null;
    const byCategory: Record<string, number> = {};
    CATEGORIES.forEach((c) => (byCategory[c] = 0));
    trip.activities.forEach((a) => (byCategory[a.category] = (byCategory[a.category] ?? 0) + a.cost));
    trip.travelLegs.forEach((l) => (byCategory.Transport += l.cost));

    const days = daysBetween(trip.startDate, trip.endDate);
    const byDay = days.map((d) => ({
      day: fmtDayHeader(d),
      date: d,
      spend: trip.activities.filter((a) => a.date === d).reduce((s, a) => s + a.cost, 0),
    }));

    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    return { byCategory, byDay, total };
  }, [trip]);

  if (!trip || !data) return null;

  const pieData = CATEGORIES.map((c) => ({
    name: c,
    value: data.byCategory[c],
    color: CATEGORY_META[c].color,
  })).filter((d) => d.value > 0);

  const perDay = data.total / tripDayCount(trip.startDate, trip.endDate);

  const rows: { label: string; category: string; cost: number; kind: "Activity" | "Leg" }[] = [
    ...trip.activities.map((a) => ({ label: a.title, category: a.category, cost: a.cost, kind: "Activity" as const })),
    ...trip.travelLegs.map((l) => {
      const from = trip.activities.find((a) => a.id === l.fromActivityId)?.title ?? "?";
      const to = trip.activities.find((a) => a.id === l.toActivityId)?.title ?? "?";
      return { label: `${l.mode}: ${from} → ${to}`, category: "Transport", cost: l.cost, kind: "Leg" as const };
    }),
  ].sort((a, b) => b.cost - a.cost);

  return (
    <div>
      <PosterHeader trip={trip} subtitle="Where every franc and pound will go." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Kpi label="Total projected" value={formatCurrency(data.total, trip.currency)} />
        <Kpi label="Per day" value={formatCurrency(perDay, trip.currency)} />
        <Kpi label="Line items" value={`${rows.length}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="border-2 border-ink bg-cream p-5" style={{ boxShadow: "4px 4px 0 var(--teal)" }}>
          <div className="stamp text-xs text-teal-dark mb-3">By category</div>
          {pieData.length === 0 ? (
            <div className="text-sm text-ink/60 py-10 text-center">No spend yet.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="#1a1a1a" strokeWidth={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v), trip.currency)} contentStyle={{ background: "#f4ebd3", border: "2px solid #1a1a1a" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="border-2 border-ink bg-cream p-5" style={{ boxShadow: "4px 4px 0 var(--orange)" }}>
          <div className="stamp text-xs text-teal-dark mb-3">Spend by day</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.byDay}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#1a1a1a" }} stroke="#1a1a1a" />
                <YAxis tick={{ fontSize: 10, fill: "#1a1a1a" }} stroke="#1a1a1a" />
                <Tooltip formatter={(v) => formatCurrency(Number(v), trip.currency)} contentStyle={{ background: "#f4ebd3", border: "2px solid #1a1a1a" }} />
                <Bar dataKey="spend" fill="#d9622b" stroke="#1a1a1a" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="border-2 border-ink bg-cream p-5" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
        <div className="stamp text-xs text-teal-dark mb-3">All line items</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="stamp text-[10px] py-2">Item</th>
              <th className="stamp text-[10px] py-2">Category</th>
              <th className="stamp text-[10px] py-2">Type</th>
              <th className="stamp text-[10px] py-2 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="text-center py-6 text-ink/60">No entries yet.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-dashed border-ink/30">
                <td className="py-2">{r.label}</td>
                <td className="py-2">
                  <span className="chip" style={{ background: CATEGORY_META[r.category as keyof typeof CATEGORY_META]?.color, color: "#f4ebd3", borderColor: "transparent" }}>
                    {r.category}
                  </span>
                </td>
                <td className="py-2 text-xs text-ink/60">{r.kind}</td>
                <td className="py-2 text-right display text-lg text-orange">{formatCurrency(r.cost, trip.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-ink bg-cream p-5" style={{ boxShadow: "4px 4px 0 var(--ink)" }}>
      <div className="stamp text-[10px] text-teal-dark">{label}</div>
      <div className="display text-3xl mt-1 text-ink">{value}</div>
    </div>
  );
}
