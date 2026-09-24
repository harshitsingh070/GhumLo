import { Hotel, Landmark, Plane, UtensilsCrossed } from "lucide-react";

/** Shared category identity (gradient + icon): used by CategoryPanel and by
 *  compact treatments (e.g. timeline thumbs) that need the same look
 *  without the full panel. Lives here (not in the component file) so
 *  fast-refresh lint stays quiet. */
export const CATEGORY_META = {
  flight: { icon: Plane, bg: "bg-gradient-to-br from-[#FF8A50] to-[#E85524]" },
  hotel: { icon: Hotel, bg: "bg-gradient-to-br from-amber-400 to-orange-500" },
  restaurant: { icon: UtensilsCrossed, bg: "bg-gradient-to-br from-rose-400 to-pink-600" },
  attraction: { icon: Landmark, bg: "bg-gradient-to-br from-emerald-400 to-teal-600" },
};
