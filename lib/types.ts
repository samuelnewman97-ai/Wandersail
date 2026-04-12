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
