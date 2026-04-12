import type { Category } from "./types";
import { Bed, Utensils, Landmark, Plane, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";

export const CATEGORY_META: Record<Category, { color: string; icon: LucideIcon; label: string }> = {
  Lodging: { color: "#1E5F5A", icon: Bed, label: "Lodging" },
  Food: { color: "#D9622B", icon: Utensils, label: "Food" },
  Activities: { color: "#243B55", icon: Landmark, label: "Activities" },
  Transport: { color: "#7B4B2A", icon: Plane, label: "Transport" },
  Shopping: { color: "#9C3353", icon: ShoppingBag, label: "Shopping" },
  Other: { color: "#4A4A4A", icon: Sparkles, label: "Other" },
};
