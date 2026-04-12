import type { ActivityProposal, Activity, Category } from "./types";
import { uid } from "./utils";

const VALID_CATEGORIES: Category[] = [
  "Lodging",
  "Food",
  "Activities",
  "Transport",
  "Shopping",
  "Other",
];

/**
 * Build a full Activity record from a proposal. Linked tasks/docs/packing
 * items are returned alongside so the caller can persist them with the same
 * linkedActivityId.
 */
export function proposalToActivity(proposal: ActivityProposal): {
  activity: Activity;
  tasks: { label: string; dueDate?: string }[];
  documents: { label: string; url: string }[];
  packing: { label: string; category?: string }[];
} {
  const now = new Date().toISOString();
  const category: Category = VALID_CATEGORIES.includes(proposal.category as Category)
    ? (proposal.category as Category)
    : "Activities";

  // If Claude gave a typical_duration_minutes but no end_time, derive end_time from start_time + duration.
  let endTime = proposal.end_time;
  if (!endTime && proposal.start_time && proposal.typical_duration_minutes) {
    const [h, m] = proposal.start_time.split(":").map(Number);
    const totalMinutes = h * 60 + m + proposal.typical_duration_minutes;
    const eh = Math.floor(totalMinutes / 60) % 24;
    const em = totalMinutes % 60;
    endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }

  const activity: Activity = {
    id: uid(),
    title: proposal.title,
    description: proposal.description,
    category,
    cost: proposal.cost_per_person,
    location: {
      label: proposal.location.label,
      lat: proposal.location.lat,
      lng: proposal.location.lng,
    },
    date: proposal.date,
    startTime: proposal.start_time,
    endTime,
    links: (proposal.links ?? []).map((l) => ({
      id: uid(),
      label: l.label,
      url: l.url,
    })),
    planningNotes: proposal.source_citations?.length
      ? `Sources: ${proposal.source_citations.join(", ")}`
      : "",
    createdAt: now,
    updatedAt: now,
  };

  return {
    activity,
    tasks: (proposal.linked_tasks ?? []).map((t) => ({
      label: t.label,
      dueDate: t.due_date,
    })),
    documents: (proposal.linked_documents ?? []).map((d) => ({
      label: d.label,
      url: d.url,
    })),
    packing: (proposal.linked_packing ?? []).map((p) => ({
      label: p.label,
      category: p.category,
    })),
  };
}
