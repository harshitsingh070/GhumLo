/** Format a number as Indian rupees: 34440 -> "₹34,440". */
export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseISO = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
};

/** "2026-10-10" -> "10 Oct"; returns "" for unusable input. */
export function fmtDay(iso) {
  const p = parseISO(iso);
  if (!p) return "";
  return `${p.d} ${MONTHS_SHORT[p.m - 1]}`;
}

/** "2026-10-10" -> "Fri, 10 Oct"; returns "" for unusable input. */
export function fmtWeekday(iso) {
  const p = parseISO(iso);
  if (!p) return "";
  const wd = WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()];
  return `${wd}, ${p.d} ${MONTHS_SHORT[p.m - 1]}`;
}

/** 0 -> "Non-stop", 1 -> "1 stop", n -> "n stops"; "" when unknown. */
export function formatStops(stops) {
  if (stops == null || stops === "") return "";
  const n = Number(stops);
  if (!Number.isFinite(n)) return "";
  if (n <= 0) return "Non-stop";
  return n === 1 ? "1 stop" : `${n} stops`;
}

/** "2026-10-10" + "2026-10-13" -> "10 Oct – 13 Oct 2026". */
export function fmtDateRange(startISO, endISO) {
  const a = parseISO(startISO);
  const b = parseISO(endISO);
  if (!a && !b) return "";
  if (a && b && a.y === b.y && a.m === b.m) {
    return `${a.d} – ${b.d} ${MONTHS_SHORT[a.m - 1]} ${a.y}`;
  }
  const left = a ? `${a.d} ${MONTHS_SHORT[a.m - 1]}${a.y !== b?.y ? " " + a.y : ""}` : "";
  const right = b ? `${b.d} ${MONTHS_SHORT[b.m - 1]} ${b.y}` : "";
  if (left && right) return `${left} – ${right}`;
  return left || right;
}

/** Map URL for a place/hotel object: prefers lat,lng; falls back to a
 *  "Name, Address" text query so the link carries the full address. */
export function placeMapUrl(p) {
  if (!p) return null;
  const query = [p.name, p.address]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  return buildMapUrl(p.lat, p.lng, query || null);
}

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
