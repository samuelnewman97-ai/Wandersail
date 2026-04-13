"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeftRail } from "@/components/layout/LeftRail";
import { HydrationGate } from "@/components/layout/HydrationGate";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { MobileRailDrawer } from "@/components/layout/MobileRailDrawer";
import { useStore } from "@/lib/store";
import { useAutoSync } from "@/lib/sync";
import { MessageCircle } from "lucide-react";

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
  const trip = useStore((s) => s.trips[tripId]);
  const setActive = useStore((s) => s.setActiveTrip);
  const chatDocked = useStore((s) => s.chatDocked);
  const setChatDocked = useStore((s) => s.setChatDocked);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  useAutoSync();

  useEffect(() => {
    if (hydrated && tripExists) setActive(tripId);
  }, [hydrated, tripExists, tripId, setActive]);

  useEffect(() => {
    if (hydrated && !tripExists) {
      // Clear stale activeTripId so the root page doesn't redirect us back here.
      if (useStore.getState().activeTripId === tripId) {
        useStore.setState({ activeTripId: null });
      }
      router.replace("/");
    }
  }, [hydrated, tripExists, tripId, router]);

  // Cmd/Ctrl+K to toggle chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatDocked(!chatDocked);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chatDocked, setChatDocked]);

  return (
    <HydrationGate>
      {tripExists && trip && (
        <>
          <MobileTopBar
            tripId={tripId}
            onOpenRail={() => setMobileRailOpen(true)}
            onOpenChat={() => setChatDocked(true)}
          />
          <MobileRailDrawer
            tripId={tripId}
            open={mobileRailOpen}
            onClose={() => setMobileRailOpen(false)}
          />
          <div className="flex min-h-screen">
            <div className="hidden md:flex">
              <LeftRail tripId={tripId} />
            </div>
            <main className="flex-1 p-4 sm:p-6 lg:p-10 min-w-0">{children}</main>
            <ChatSidebar
              trip={trip}
              open={chatDocked}
              onClose={() => setChatDocked(false)}
            />
          </div>
          {!chatDocked && (
            <button
              onClick={() => setChatDocked(true)}
              className="hidden md:inline-flex fixed bottom-6 right-6 z-40 btn-poster"
              style={{ boxShadow: "5px 5px 0 var(--orange)" }}
              aria-label="Ask Claude (Ctrl+K)"
              title="Ask Claude · Ctrl+K"
            >
              <MessageCircle size={16} /> Ask Claude
            </button>
          )}
        </>
      )}
    </HydrationGate>
  );
}
