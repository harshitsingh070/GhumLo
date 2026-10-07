import { Hotel, Landmark, Plane, UtensilsCrossed } from "lucide-react";

/** Shared category identity (light tint + icon): used by CategoryPanel and by
 *  compact treatments (e.g. timeline thumbs) that need the same look
 *  without the full panel. Lives here (not in the component file) so
 *  fast-refresh lint stays quiet. */
export const CATEGORY_META = {
  flight: { icon: Plane, bg: "bg-[#EFF6FF]" },
  hotel: { icon: Hotel, bg: "bg-[#F5F3FF]" },
  restaurant: { icon: UtensilsCrossed, bg: "bg-[#FFFBEB]" },
  attraction: { icon: Landmark, bg: "bg-[#ECFDF3]" },
};
