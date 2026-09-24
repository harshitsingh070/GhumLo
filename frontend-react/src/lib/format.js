/** Format a number as Indian rupees: 34440 -> "₹34,440". */
export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const isCoord = (v) => typeof v === "number" && Number.isFinite(v);

/** Build a Google Maps search URL (pure, client-side, no API call).
 *  Prefers lat,lng; falls back to an encoded text query; null if neither. */
export function buildMapUrl(lat, lng, fallbackQuery) {
  if (isCoord(lat) && isCoord(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (typeof fallbackQuery === "string" && fallbackQuery.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery.trim())}`;
  }
  return null;
}
