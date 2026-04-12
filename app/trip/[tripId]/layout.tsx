"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeftRail } from "@/components/layout/LeftRail";
import { HydrationGate } from "@/components/layout/HydrationGate";
import { useStore } from "@/lib/store";

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const tripExists = useStore((s) => Boolean(s.trips[tripId]));
  const setActive = useStore((s) => s.setActiveTrip);

  useEffect(() => {
    if (hydrated && tripExists) setActive(tripId);
  }, [hydrated, tripExists, tripId, setActive]);

  useEffect(() => {
    if (hydrated && !tripExists) router.replace("/");
  }, [hydrated, tripExists, router]);

  return (
    <HydrationGate>
      {tripExists && (
        <div className="flex min-h-screen">
          <LeftRail tripId={tripId} />
          <main className="flex-1 p-8 md:p-12 max-w-6xl">{children}</main>
        </div>
      )}
    </HydrationGate>
  );
}
