export type TripId = string;
export type Iso = string;

export const CATEGORIES = [
  "Lodging",
  "Food",
  "Activities",
  "Transport",
  "Shopping",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const TRAVEL_MODES = [
  "Flight",
  "Train",
  "Car",
  "Bus",
  "Ferry",
  "Walk",
] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];

export interface Link {
  id: string;
  label: string;
  url: string;
}

export interface Location {
  label: string;
  lat?: number;
  lng?: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: Category;
  cost: number;
  location: Location;
  date: Iso; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  links: Link[];
  planningNotes: string;
  createdAt: Iso;
  updatedAt: Iso;
}

export interface TravelLegDetails {
  carrier?: string;
  confirmationNumber?: string;
  departTime?: string;
  arriveTime?: string;
  notes?: string;
}

export interface TravelLeg {
  id: string;
  fromActivityId: string;
  toActivityId: string;
  mode: TravelMode;
  cost: number;
  details: TravelLegDetails;
  planningNotes: string;
}

export interface Task {
  id: string;
  label: string;
  done: boolean;
  dueDate?: Iso;
  linkedActivityId?: string;
}

export interface PackingItem {
  id: string;
  label: string;
  category: string;
  packed: boolean;
  linkedActivityId?: string;
}

export interface DocumentRef {
  id: string;
  label: string;
  url: string;
  activityId?: string;
}

export interface Trip {
  id: TripId;
  name: string;
  startDate: Iso;
  endDate: Iso;
  currency: string;
  coverEmoji: string;
  activities: Activity[];
  travelLegs: TravelLeg[];
  tasks: Task[];
  packing: PackingItem[];
  documents: DocumentRef[];
}

// ---------- Chat (v2.0) ----------

export interface ChatThread {
  messages: ChatMessage[];
  updatedAt: Iso;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string; // markdown
  toolCalls?: ChatToolCall[];
  status?: "streaming" | "complete" | "error";
  error?: string;
  createdAt: Iso;
}

export interface ChatToolCall {
  id: string; // the tool_use_id from Claude
  name: string;
  input: unknown;
  /** For web_search: the results. For propose_activity: the accepted activity id. */
  result?: unknown;
  status: "running" | "pending_review" | "accepted" | "rejected" | "completed";
}

export interface ActivityProposal {
  title: string;
  description: string;
  category: Category;
  cost_per_person: number;
  currency?: string;
  location: { label: string; lat?: number; lng?: number };
  date: string;
  start_time?: string;
  end_time?: string;
  typical_duration_minutes?: number;
  links?: { label: string; url: string }[];
  linked_tasks?: { label: string; due_date?: string }[];
  linked_documents?: { label: string; url: string }[];
  linked_packing?: { label: string; category?: string }[];
  source_citations?: string[];
}
