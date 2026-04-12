"use client";

import { useStore } from "@/lib/store";
import type { ReactNode } from "react";

export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="stamp text-sm text-teal-dark">Unfolding your map…</div>
      </div>
    );
  }
  return <>{children}</>;
}
