/** Stable place identity. Provider IDs win; otherwise a deterministic
 *  composite of name + coordinates (+ day/index where the call site has
 *  them). Never key by bare name — duplicate names ("Sunset Point" twice
 *  in one city) collide in maps, favorites, and selection state. */

export function placeIdentity(place) {
  const p = place || {};
  if (p.place_id) return `pid:${p.place_id}`;
  if (p.data_id) return `did:${p.data_id}`;
  const lat = Number.isFinite(p.lat) ? p.lat : "?";
  const lng = Number.isFinite(p.lng) ? p.lng : "?";
  return `n:${String(p.name ?? "")}|${lat},${lng}`;
}

export function placeKey(place, day, idx) {
  return `${placeIdentity(place)}|d${day ?? "?"}:i${idx ?? "?"}`;
}
