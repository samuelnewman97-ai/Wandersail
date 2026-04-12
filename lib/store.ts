"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Trip,
  TripId,
  Activity,
  TravelLeg,
  Task,
  PackingItem,
  DocumentRef,
  Link,
} from "./types";
import { uid } from "./utils";
import { todayIso, shiftDay } from "./date";

interface Store {
  trips: Record<TripId, Trip>;
  activeTripId: TripId | null;
  mapboxToken: string | null;
  hydrated: boolean;

  setHydrated: () => void;
  setMapboxToken: (token: string | null) => void;
  createTrip: (name: string, startDate: string, endDate: string, emoji?: string) => TripId;
  deleteTrip: (id: TripId) => void;
  setActiveTrip: (id: TripId) => void;
  updateTripMeta: (id: TripId, patch: Partial<Pick<Trip, "name" | "startDate" | "endDate" | "currency" | "coverEmoji">>) => void;

  upsertActivity: (tripId: TripId, activity: Activity) => void;
  removeActivity: (tripId: TripId, activityId: string) => void;

  upsertLeg: (tripId: TripId, leg: TravelLeg) => void;
  removeLeg: (tripId: TripId, legId: string) => void;

  upsertTask: (tripId: TripId, task: Task) => void;
  toggleTask: (tripId: TripId, taskId: string) => void;
  removeTask: (tripId: TripId, taskId: string) => void;

  upsertPacking: (tripId: TripId, item: PackingItem) => void;
  togglePacking: (tripId: TripId, itemId: string) => void;
  removePacking: (tripId: TripId, itemId: string) => void;

  upsertDocument: (tripId: TripId, doc: DocumentRef) => void;
  removeDocument: (tripId: TripId, docId: string) => void;

  importTrip: (trip: Trip) => TripId;
}

function blankTrip(name: string, startDate: string, endDate: string, emoji = "✈️"): Trip {
  return {
    id: uid(),
    name,
    startDate,
    endDate,
    currency: "USD",
    coverEmoji: emoji,
    activities: [],
    travelLegs: [],
    tasks: [],
    packing: [],
    documents: [],
  };
}

function seedTrip(): Trip {
  const start = todayIso();
  const trip = blankTrip("Paris Spring Break", start, shiftDay(start, 4), "🗼");
  const d0 = start;
  const d1 = shiftDay(start, 1);
  const d2 = shiftDay(start, 2);
  const now = new Date().toISOString();

  const mkAct = (overrides: Partial<Activity>): Activity => ({
    id: uid(),
    title: "",
    description: "",
    category: "Activities",
    cost: 0,
    location: { label: "" },
    date: d0,
    links: [],
    planningNotes: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  trip.activities = [
    mkAct({
      title: "Hotel Le Marais",
      description: "Check in to the boutique hotel in the 4th arrondissement.",
      category: "Lodging",
      cost: 420,
      location: { label: "Le Marais, Paris", lat: 48.8566, lng: 2.3611 },
      date: d0,
      startTime: "15:00",
      planningNotes: "Bring passport. Concierge closes at 23:00.",
    }),
    mkAct({
      title: "Dinner at Chez Janou",
      description: "Provençal bistro — famous chocolate mousse.",
      category: "Food",
      cost: 85,
      location: { label: "2 Rue Roger Verlomme, Paris", lat: 48.8543, lng: 2.3656 },
      date: d0,
      startTime: "19:30",
      endTime: "21:30",
      planningNotes: "Reserve 3 weeks ahead.",
    }),
    mkAct({
      title: "Louvre Museum",
      description: "Pre-book timed entry for 10am.",
      category: "Activities",
      cost: 22,
      location: { label: "Rue de Rivoli, Paris", lat: 48.8606, lng: 2.3376 },
      date: d1,
      startTime: "10:00",
      endTime: "13:30",
      planningNotes: "Timed entry required. Bags must be under 55cm.",
    }),
    mkAct({
      title: "Eiffel Tower Summit",
      description: "Sunset tickets for the top floor.",
      category: "Activities",
      cost: 45,
      location: { label: "Champ de Mars, Paris", lat: 48.8584, lng: 2.2945 },
      date: d2,
      startTime: "18:00",
      endTime: "20:00",
      planningNotes: "Wear layers — windy at the top.",
    }),
  ];

  trip.tasks = [
    { id: uid(), label: "Renew passport (expires in 4 months)", done: true, dueDate: d0 },
    { id: uid(), label: "Book Louvre timed-entry tickets", done: false, dueDate: d0 },
    { id: uid(), label: "Notify bank of travel dates", done: false },
    { id: uid(), label: "Download offline map of Paris", done: false },
  ];

  trip.packing = [
    { id: uid(), label: "Passport", category: "Documents", packed: true },
    { id: uid(), label: "Travel adapter (EU)", category: "Tech", packed: false },
    { id: uid(), label: "Comfortable walking shoes", category: "Clothes", packed: false },
  ];

  trip.documents = [
    { id: uid(), label: "Hotel confirmation", url: "https://example.com/hotel" },
  ];

  return trip;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      trips: {},
      activeTripId: null,
      mapboxToken: null,
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),
      setMapboxToken: (token) => set({ mapboxToken: token && token.trim() ? token.trim() : null }),

      createTrip: (name, startDate, endDate, emoji) => {
        const trip = blankTrip(name, startDate, endDate, emoji);
        set((s) => ({
          trips: { ...s.trips, [trip.id]: trip },
          activeTripId: trip.id,
        }));
        return trip.id;
      },

      deleteTrip: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.trips;
          const remainingIds = Object.keys(rest);
          return {
            trips: rest,
            activeTripId: s.activeTripId === id ? (remainingIds[0] ?? null) : s.activeTripId,
          };
        }),

      setActiveTrip: (id) => set({ activeTripId: id }),

      updateTripMeta: (id, patch) =>
        set((s) => {
          const trip = s.trips[id];
          if (!trip) return s;
          return { trips: { ...s.trips, [id]: { ...trip, ...patch } } };
        }),

      upsertActivity: (tripId, activity) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          const exists = trip.activities.some((a) => a.id === activity.id);
          const activities = exists
            ? trip.activities.map((a) => (a.id === activity.id ? activity : a))
            : [...trip.activities, activity];
          return { trips: { ...s.trips, [tripId]: { ...trip, activities } } };
        }),

      removeActivity: (tripId, activityId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: {
                ...trip,
                activities: trip.activities.filter((a) => a.id !== activityId),
                travelLegs: trip.travelLegs.filter(
                  (l) => l.fromActivityId !== activityId && l.toActivityId !== activityId
                ),
              },
            },
          };
        }),

      upsertLeg: (tripId, leg) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          const exists = trip.travelLegs.some((l) => l.id === leg.id);
          const travelLegs = exists
            ? trip.travelLegs.map((l) => (l.id === leg.id ? leg : l))
            : [...trip.travelLegs, leg];
          return { trips: { ...s.trips, [tripId]: { ...trip, travelLegs } } };
        }),

      removeLeg: (tripId, legId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: { ...trip, travelLegs: trip.travelLegs.filter((l) => l.id !== legId) },
            },
          };
        }),

      upsertTask: (tripId, task) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          const exists = trip.tasks.some((t) => t.id === task.id);
          const tasks = exists
            ? trip.tasks.map((t) => (t.id === task.id ? task : t))
            : [...trip.tasks, task];
          return { trips: { ...s.trips, [tripId]: { ...trip, tasks } } };
        }),

      toggleTask: (tripId, taskId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: {
                ...trip,
                tasks: trip.tasks.map((t) =>
                  t.id === taskId ? { ...t, done: !t.done } : t
                ),
              },
            },
          };
        }),

      removeTask: (tripId, taskId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: { ...trip, tasks: trip.tasks.filter((t) => t.id !== taskId) },
            },
          };
        }),

      upsertPacking: (tripId, item) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          const exists = trip.packing.some((p) => p.id === item.id);
          const packing = exists
            ? trip.packing.map((p) => (p.id === item.id ? item : p))
            : [...trip.packing, item];
          return { trips: { ...s.trips, [tripId]: { ...trip, packing } } };
        }),

      togglePacking: (tripId, itemId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: {
                ...trip,
                packing: trip.packing.map((p) =>
                  p.id === itemId ? { ...p, packed: !p.packed } : p
                ),
              },
            },
          };
        }),

      removePacking: (tripId, itemId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: { ...trip, packing: trip.packing.filter((p) => p.id !== itemId) },
            },
          };
        }),

      upsertDocument: (tripId, doc) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          const exists = trip.documents.some((d) => d.id === doc.id);
          const documents = exists
            ? trip.documents.map((d) => (d.id === doc.id ? doc : d))
            : [...trip.documents, doc];
          return { trips: { ...s.trips, [tripId]: { ...trip, documents } } };
        }),

      removeDocument: (tripId, docId) =>
        set((s) => {
          const trip = s.trips[tripId];
          if (!trip) return s;
          return {
            trips: {
              ...s.trips,
              [tripId]: { ...trip, documents: trip.documents.filter((d) => d.id !== docId) },
            },
          };
        }),

      importTrip: (trip) => {
        const newTrip = { ...trip, id: uid() };
        set((s) => ({
          trips: { ...s.trips, [newTrip.id]: newTrip },
          activeTripId: newTrip.id,
        }));
        return newTrip.id;
      },
    }),
    {
      name: "travel-planner:v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If the store is empty after rehydration, seed a starter trip
          if (Object.keys(state.trips).length === 0) {
            const trip = seedTrip();
            state.trips[trip.id] = trip;
            state.activeTripId = trip.id;
          }
          state.setHydrated();
        }
      },
    }
  )
);

// Helper hook for the active trip
export function useActiveTrip(): Trip | null {
  return useStore((s) => (s.activeTripId ? s.trips[s.activeTripId] ?? null : null));
}

export function newActivity(date: string): Activity {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: "",
    description: "",
    category: "Activities",
    cost: 0,
    location: { label: "" },
    date,
    links: [],
    planningNotes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function newLink(label = "", url = ""): Link {
  return { id: uid(), label, url };
}

export function newTask(label = ""): Task {
  return { id: uid(), label, done: false };
}

export function newPackingItem(label = "", category = "General"): PackingItem {
  return { id: uid(), label, category, packed: false };
}

export function newDocument(label = "", url = ""): DocumentRef {
  return { id: uid(), label, url };
}

export function newLeg(fromId: string, toId: string): TravelLeg {
  return {
    id: uid(),
    fromActivityId: fromId,
    toActivityId: toId,
    mode: "Car",
    cost: 0,
    details: {},
    planningNotes: "",
  };
}
