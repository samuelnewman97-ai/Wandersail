"use client";

import { useEffect } from "react";
import { LeftRail } from "./LeftRail";

interface Props {
  tripId: string;
  open: boolean;
  onClose: () => void;
}

export function MobileRailDrawer({ tripId, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] flex">
        <LeftRail tripId={tripId} onNavigate={onClose} />
      </div>
    </div>
  );
}
