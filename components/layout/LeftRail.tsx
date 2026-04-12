"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  BookOpen,
  Wallet,
  CalendarDays,
  Map as MapIcon,
  Plane,
  CheckSquare,
  Luggage,
  FileText,
  Settings,
} from "lucide-react";
import { TripSwitcher } from "./TripSwitcher";

const NAV = [
  { href: "", label: "Itinerary", icon: BookOpen },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/travel", label: "Travel", icon: Plane },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, badge: "tasks" as const },
  { href: "/packing", label: "Packing", icon: Luggage },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function LeftRail({ tripId, onNavigate }: { tripId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const trip = useStore((s) => s.trips[tripId]);

  const remainingTasks = trip?.tasks.filter((t) => !t.done).length ?? 0;

  return (
    <aside className="w-64 shrink-0 border-r-2 border-ink bg-cream flex flex-col min-h-screen">
      <div className="p-5 border-b-2 border-dashed border-ink/40">
        <Link href="/" className="display text-2xl block leading-none">
          Wander<span className="text-orange">sail</span>
        </Link>
        <div className="stamp text-[10px] text-teal-dark mt-1">— Katie's Travel Journal —</div>
      </div>

      <div className="p-4 border-b-2 border-dashed border-ink/40">
        <TripSwitcher activeTripId={tripId} />
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => {
          const href = `/trip/${tripId}${item.href}`;
          const active =
            item.href === ""
              ? pathname === `/trip/${tripId}`
              : pathname.startsWith(href);
          const Icon = item.icon;
          const showBadge = item.badge === "tasks" && remainingTasks > 0;
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <Icon size={16} strokeWidth={2.25} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 bg-orange text-cream text-[10px] font-bold border border-ink">
                  {remainingTasks}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t-2 border-dashed border-ink/40">
        <SyncStatusPill />
      </div>
    </aside>
  );
}

function SyncStatusPill() {
  const status = useStore((s) => s.syncStatus);
  const lastSyncAt = useStore((s) => s.lastSyncAt);
  const error = useStore((s) => s.syncError);

  const label = {
    idle: "• Not synced",
    syncing: "○ Syncing…",
    synced: "● Synced",
    error: "⚠ Sync error",
    offline: "✈ Offline",
  }[status];

  const color = {
    idle: "text-ink/50",
    syncing: "text-teal-dark",
    synced: "text-teal",
    error: "text-orange",
    offline: "text-ink/60",
  }[status];

  const timeLabel = lastSyncAt
    ? ` · ${new Date(lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "";

  return (
    <div className={`stamp text-[10px] ${color}`} title={error ?? ""}>
      {label}
      {status === "synced" && timeLabel}
    </div>
  );
}
