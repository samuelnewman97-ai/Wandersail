import type { TravelMode } from "./types";
import { Plane, Train, Car, Bus, Ship, Footprints, type LucideIcon } from "lucide-react";

export const TRAVEL_MODE_META: Record<TravelMode, { icon: LucideIcon; label: string; stroke: "solid" | "dashed" | "dotted" }> = {
  Flight: { icon: Plane, label: "Flight", stroke: "dashed" },
  Train: { icon: Train, label: "Train", stroke: "solid" },
  Car: { icon: Car, label: "Car", stroke: "solid" },
  Bus: { icon: Bus, label: "Bus", stroke: "solid" },
  Ferry: { icon: Ship, label: "Ferry", stroke: "dotted" },
  Walk: { icon: Footprints, label: "Walk", stroke: "dotted" },
};
