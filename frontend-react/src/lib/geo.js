/** Shared geo math for itinerary display (map chips, timeline leg labels).
 *  Same haversine formula as backend itinerary.haversine_km. Pure, no I/O.
 *  (ItineraryMap.jsx keeps its own long-verified local copy untouched.) */

const isCoord = (v) => typeof v === "number" && Number.isFinite(v);

export const hasCoords = (p) => !!p && isCoord(p.lat) && isCoord(p.lng);

/** Straight-line distance between two lat/lng points, in km. */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** Compact leg label: "0.8 km" below 10 km, whole km above. */
export function fmtLeg(km) {
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Split a day's stops across Morning/Afternoon/Evening as evenly as
 *  possible (extra stops go to earlier blocks: 3->[1,1,1], 4->[2,1,1],
 *  2->[1,1,0]). Returns [{block, stops}] with empty blocks dropped —
 *  no fabricated clock times, just time-of-day grouping. */
export function splitDayParts(places) {
  const list = Array.isArray(places) ? places : [];
  const n = list.length;
  const base = Math.floor(n / 3);
  const rem = n % 3;
  const names = ["Morning", "Afternoon", "Evening"];
  let at = 0;
  return names
    .map((block, i) => {
      const size = base + (i < rem ? 1 : 0);
      const stops = list.slice(at, at + size);
      at += size;
      return { block, stops };
    })
    .filter((g) => g.stops.length > 0);
}
