import type { Trip } from "./types";
import * as ics from "ics";
import { parseISO } from "date-fns";

export function downloadJson(trip: Trip) {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(trip.name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadIcs(trip: Trip) {
  const events: ics.EventAttributes[] = trip.activities.map((a) => {
    const d = parseISO(a.date);
    const [sh, sm] = (a.startTime ?? "09:00").split(":").map(Number);
    const duration = calcDuration(a.startTime, a.endTime);
    return {
      title: a.title,
      description: [a.description, a.planningNotes].filter(Boolean).join("\n\n"),
      location: a.location.label,
      start: [d.getFullYear(), d.getMonth() + 1, d.getDate(), sh, sm],
      duration,
    };
  });
  const { error, value } = ics.createEvents(events);
  if (error || !value) {
    alert("Could not generate calendar file: " + error?.message);
    return;
  }
  const blob = new Blob([value], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(trip.name)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function calcDuration(start?: string, end?: string): { hours: number; minutes: number } {
  if (!start || !end) return { hours: 1, minutes: 0 };
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return { hours: 1, minutes: 0 };
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
