"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const activeTripId = useStore((s) => s.activeTripId);
  const tripCount = useStore((s) => Object.keys(s.trips).length);

  useEffect(() => {
    if (!hydrated) return;
    if (activeTripId) {
      router.replace(`/trip/${activeTripId}`);
    } else if (tripCount === 0) {
      router.replace("/new-trip");
    }
  }, [hydrated, activeTripId, tripCount, router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <div className="stamp text-sm text-teal-dark mb-2">Loading your atlas…</div>
        <div className="display text-5xl">✈️</div>
      </div>
    </div>
  );
}
