import { CATEGORY_META } from "../lib/categories.js";

/** Photo substitute: light category tint + navy watermark icon. Size is entirely
 *  caller-controlled via className (panels, banners, timeline thumbs).
 *  Props: category 'flight'|'hotel'|'restaurant'|'attraction', className. */
const LIGHT_BG = {
  flight: "bg-[#EFF6FF]",
  hotel: "bg-[#FFFBEB]",
  restaurant: "bg-[#FFF1EE]",
  attraction: "bg-[#F5F3FF]",
};

export default function CategoryPanel({ category, className = "" }) {
  const c = CATEGORY_META[category] ?? CATEGORY_META.attraction;
  const Icon = c.icon;
  const bg = LIGHT_BG[category] ?? LIGHT_BG.attraction;
  return (
    <div
      className={`relative overflow-hidden ${bg} ${className}`}
      style={{ border: "1px solid #EEF2F6" }}
      role="img"
      aria-label={`${category} illustration`}
    >
      <Icon
        className="absolute -bottom-4 -right-4 h-24 w-24 text-[#102A43]/10"
        aria-hidden="true"
      />
    </div>
  );
}
