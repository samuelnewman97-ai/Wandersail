"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";
import type { Trip, TripId, ChatThread } from "./types";

export interface SyncedState {
  trips: Record<TripId, Trip>;
  chats: Record<TripId, ChatThread>;
  chatModel: string;
  // NOT synced: anthropicApiKey, mapboxToken, chatDocked, activeTripId, sync status
}

interface PullResult {
  data: SyncedState | null;
  updatedAt: string | null;
}

export async function pullState(): Promise<PullResult> {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  return res.json();
}

export async function pushState(data: SyncedState): Promise<{ syncedAt: string }> {
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
  return res.json();
}

/**
 * Hook that keeps the local Zustand store in sync with the cloud backend:
 *   - Initial pull on mount/hydration (server wins for a fresh device)
 *   - Debounced push whenever synced fields change
 *   - Pull on window focus (pick up changes from other devices)
 *   - Listen to online/offline events
 *
 * Mount this once at the top of the trip layout.
 */
export function useAutoSync() {
  const hydrated = useStore((s) => s.hydrated);
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const replaceSyncedState = useStore((s) => s.replaceSyncedState);

  const didInitialPull = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedJson = useRef<string | null>(null);

  const doPull = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    try {
      setSyncStatus("syncing");
      const { data } = await pullState();
      if (data) {
        replaceSyncedState({
          trips: data.trips ?? {},
          chats: data.chats ?? {},
          chatModel: data.chatModel ?? useStore.getState().chatModel,
        });
        // Record what we have so push doesn't immediately re-fire.
        lastPushedJson.current = JSON.stringify({
          trips: data.trips ?? {},
          chats: data.chats ?? {},
          chatModel: data.chatModel ?? useStore.getState().chatModel,
        });
      }
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const doPush = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }
    const s = useStore.getState();
    const synced: SyncedState = {
      trips: s.trips,
      chats: s.chats,
      chatModel: s.chatModel,
    };
    const json = JSON.stringify(synced);
    // Skip if nothing changed since the last push (avoids redundant pushes
    // when the store is reset by a pull).
    if (json === lastPushedJson.current) return;
    try {
      setSyncStatus("syncing");
      await pushState(synced);
      lastPushedJson.current = json;
      setSyncStatus("synced");
    } catch (e) {
      setSyncStatus("error", e instanceof Error ? e.message : "Unknown error");
    }
  };

  // Initial pull after hydration
  useEffect(() => {
    if (!hydrated || didInitialPull.current) return;
    didInitialPull.current = true;
    void doPull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Debounced push on any change to synced fields
  useEffect(() => {
    if (!hydrated) return;
    const unsub = useStore.subscribe((state, prev) => {
      // Only react to changes in the synced slice
      if (
        state.trips === prev.trips &&
        state.chats === prev.chats &&
        state.chatModel === prev.chatModel
      ) {
        return;
      }
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        void doPush();
      }, 1000);
    });
    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Pull on window focus
  useEffect(() => {
    if (!hydrated) return;
    const onFocus = () => void doPull();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Online/offline events
  useEffect(() => {
    const onOnline = () => {
      void doPush().then(() => doPull());
    };
    const onOffline = () => setSyncStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
