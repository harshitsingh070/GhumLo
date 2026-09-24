import { MapPinned, Route, Star, Sun, Sunrise, Sunset } from "lucide-react";
import { CATEGORY_META } from "../lib/categories.js";
import { buildMapUrl } from "../lib/format.js";
import { fmtLeg, hasCoords, haversineKm, splitDayParts } from "../lib/geo.js";

/* Day palette mirrored from ItineraryMap (kept local so the verified map
 * file stays untouched) — timeline dots match map marker colors. */
const DAY_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4"];
const colorForDay = (day) => DAY_COLORS[(Number(day) - 1 + DAY_COLORS.length) % DAY_COLORS.length];

const BLOCK_ICONS = { Morning: Sunrise, Afternoon: Sun, Evening: Sunset };

const metaFor = (category) =>
  CATEGORY_META[category === "restaurants" ? "restaurant" : "attraction"];

/** One day's stops as a vertical timeline (rail + dots + per-leg distance
 *  chips), grouped under Morning/Afternoon/Evening headers.
 *  Props: {day} — shape unchanged. Day tabs + map live in ItinerarySection. */
export default function ItineraryDay({ day }) {
  if (!day || !Array.isArray(day.places) || day.places.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No nearby places found for this day.</p>;
  }

  const dot = colorForDay(day.day);
  // Leg chip per stop: straight-line distance from the previous stop of the
  // SAME day (spans block boundaries); skipped when coords are missing.
  const legs = day.places.map((p, i) => {
    if (i === 0) return null;
    const prev = day.places[i - 1];
    if (!hasCoords(p) || !hasCoords(prev)) return null;
    return fmtLeg(haversineKm(prev.lat, prev.lng, p.lat, p.lng));
  });
  let seen = 0; // global stop index across blocks (for legs[])
  const groups = splitDayParts(day.places);

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const BlockIcon = BLOCK_ICONS[g.block] ?? Sun;
        return (
        <div key={g.block}>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <BlockIcon className="h-3.5 w-3.5" />
            {g.block}
          </h4>
          <ol className="relative ml-1.5 space-y-1 border-l-2 border-slate-200 dark:border-slate-700">
            {g.stops.map((p) => {
              const idx = seen++;
              const leg = legs[idx];
              const mapUrl = buildMapUrl(
                p.lat,
                p.lng,
                [p.name, p.address].filter(Boolean).join(", ")
              );
              const meta = metaFor(p.category);
              const Thumb = meta.icon;
              return (
                <li key={idx} className="relative pl-7">
                  <span
                    className="absolute -left-[7px] top-3 h-3 w-3 rounded-full shadow ring-2 ring-white dark:ring-slate-800"
                    style={{ backgroundColor: dot }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                      role="img"
                      aria-label={p.category || "place"}
                    >
                      <Thumb className="h-5 w-5 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {mapUrl ? (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on map"
                            aria-label={`View ${p.name} on map`}
                            className="tcc-focus font-bold underline-offset-2 hover:text-clay hover:underline"
                          >
                            {p.name}
                            <MapPinned className="ml-1 inline h-3.5 w-3.5 text-slate-400" />
                          </a>
                        ) : (
                          <strong>{p.name}</strong>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{p.category}</span>
                        {typeof p.rating === "number" && (
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
                          </span>
                        )}
                        {leg && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-px text-[10px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                            title="Straight-line distance from previous stop"
                          >
                            <Route className="h-3 w-3" /> {leg}
                          </span>
                        )}
                      </p>
                      {p.address ? (
                        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{p.address}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        );
      })}
    </div>
  );
}
