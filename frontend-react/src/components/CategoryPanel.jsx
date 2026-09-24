import { CATEGORY_META } from "../lib/categories.js";

/** Photo substitute: category gradient + watermark icon. Size is entirely
 *  caller-controlled via className (panels, banners, timeline thumbs).
 *  Props: category 'flight'|'hotel'|'restaurant'|'attraction', className. */
export default function CategoryPanel({ category, className = "" }) {
  const c = CATEGORY_META[category] ?? CATEGORY_META.attraction;
  const Icon = c.icon;
  return (
    <div
      className={`relative overflow-hidden ${c.bg} ${className}`}
      role="img"
      aria-label={`${category} illustration`}
    >
      <Icon
        className="absolute -bottom-4 -right-4 h-24 w-24 text-white/30"
        aria-hidden="true"
      />
    </div>
  );
}
