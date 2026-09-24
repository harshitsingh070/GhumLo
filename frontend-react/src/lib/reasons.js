import { inr } from "./format.js";

/** "Why we picked this trip" checklist items, derived from /api/plan data.
 *  Pure function (no I/O) — same signals as the backend insight sentence
 *  (budget headroom, ratings, clustering tightness) plus accommodation
 *  share, all computed from fields already in the response. Conditions keep
 *  weak claims out: rating/cluster items render only when the numbers earn
 *  them; budget + split always render. Returns [{key, text}]. */
export function buildReasons({ best_pick, fits_budget, remaining_budget, budget, itinerary }) {
  const out = [];
  const total = Number(best_pick?.total_cost) || 0;
  const flight = Number(best_pick?.flight?.price) || 0;
  const hotel = Number(best_pick?.hotel?.total_price) || 0;

  if (budget > 0 && total > 0) {
    if (fits_budget) {
      const pct = Math.round((Number(remaining_budget) / budget) * 100);
      out.push({
        key: "budget",
        text: `${inr(remaining_budget)} left over — ${pct}% under your ${inr(budget)} budget`,
      });
    } else {
      const overBy = Number(best_pick?.over_by) || Math.max(0, total - budget);
      out.push({
        key: "budget",
        text: `Cheapest combo available — ${inr(overBy)} over your ${inr(budget)} budget`,
      });
    }
  }

  const days = Array.isArray(itinerary) ? itinerary : [];
  const rated = [];
  for (const d of days) {
    for (const p of d.places || []) {
      if (typeof p.rating === "number" && Number.isFinite(p.rating)) rated.push(p.rating);
    }
  }
  if (rated.length > 0) {
    const avg = Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10;
    if (avg >= 4.0) {
      out.push({
        key: "rating",
        text: `Stops average ${avg}★ across ${rated.length} rated place${rated.length === 1 ? "" : "s"}`,
      });
    }
  }

  const kms = days
    .map((d) => d.distance_km)
    .filter((k) => typeof k === "number" && Number.isFinite(k) && k > 0);
  if (kms.length > 0) {
    const avgKm = Math.round((kms.reduce((a, b) => a + b, 0) / kms.length) * 10) / 10;
    if (avgKm <= 8) {
      out.push({
        key: "cluster",
        text: `Tightly packed days — about ${avgKm} km between stops on average`,
      });
    }
  }

  if (total > 0 && hotel > 0) {
    const hotelShare = Math.round((hotel / total) * 100);
    out.push({
      key: "split",
      text:
        hotelShare < 50
          ? `Stay costs just ${hotelShare}% of the total (${inr(hotel)}) — flights take the rest`
          : `Flight costs just ${100 - hotelShare}% of the total (${inr(flight)}) — the stay takes the rest`,
    });
  }

  return out;
}
