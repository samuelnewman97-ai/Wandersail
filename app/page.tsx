"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  // Resolve an actually-existing trip to navigate to, defending against a
  // stale activeTripId that no longer points at a trip (e.g. after a cloud
  // pull wiped trips but activeTripId was still cached in localStorage).
  const targetTripId = useStore((s) => {
    if (s.activeTripId && s.trips[s.activeTripId]) return s.activeTripId;
    return Object.keys(s.trips)[0] ?? null;
  });

  useEffect(() => {
    if (!hydrated) return;
    if (targetTripId) {
      router.replace(`/trip/${targetTripId}`);
    } else {
      router.replace("/new-trip");
    }
  }, [hydrated, targetTripId, router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <div className="stamp text-sm text-teal-dark mb-2">Loading your atlas…</div>
        <div className="display text-5xl">✈️</div>
      </div>
    </div>
  );
}
