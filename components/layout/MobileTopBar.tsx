"use client";

import { useStore } from "@/lib/store";
import { Menu, MessageCircle } from "lucide-react";

interface Props {
  tripId: string;
  onOpenRail: () => void;
  onOpenChat: () => void;
}

export function MobileTopBar({ tripId, onOpenRail, onOpenChat }: Props) {
  const trip = useStore((s) => s.trips[tripId]);

  return (
    <header className="md:hidden sticky top-0 z-30 h-14 border-b-2 border-ink bg-cream flex items-center gap-2 px-3">
      <button
        onClick={onOpenRail}
        aria-label="Open navigation"
        className="w-11 h-11 shrink-0 border-2 border-ink bg-cream grid place-items-center hover:bg-cream-dark"
      >
        <Menu size={18} />
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-2xl shrink-0" aria-hidden>
          {trip?.coverEmoji ?? "✈️"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="stamp text-[9px] text-orange leading-none">— Wandersail —</div>
          <div className="display text-base leading-tight truncate">{trip?.name ?? "Trip"}</div>
        </div>
      </div>
      <button
        onClick={onOpenChat}
        aria-label="Ask Claude"
        className="w-11 h-11 shrink-0 border-2 border-ink bg-cream grid place-items-center hover:bg-cream-dark"
        style={{ boxShadow: "3px 3px 0 var(--orange)" }}
      >
        <MessageCircle size={16} />
      </button>
    </header>
  );
}
