import { MapPinned, Star } from "lucide-react";
import { CATEGORY_META } from "../lib/categories.js";
import { buildMapUrl } from "../lib/format.js";

const metaFor = (category) =>
  CATEGORY_META[category === "restaurants" ? "restaurant" : "attraction"];

/** Standalone "Popular places" grid: top-rated places across attractions +
 *  restaurants from the plan's full places list (a re-sort of data already
 *  fetched — zero new API calls), independent of the day-by-day schedule.
 *  Renders null when there's nothing to show. Props: places, destination. */
export default function PopularPlaces({ places, destination }) {
  const top = (Array.isArray(places) ? places : [])
    .filter((p) => p && p.name)
    .slice()
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 6);

  if (top.length === 0) return null;

  return (
    <section
      aria-label="Popular places to visit"
      className="rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
        Popular places in {destination}
      </h2>
      <p className="mb-4 mt-1 text-sm text-smoke dark:text-white/55">
        Top-rated spots across your attraction &amp; restaurant results — worth seeing, whichever
        day you schedule them.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((p, i) => {
          const meta = metaFor(p.category);
          const Icon = meta.icon;
          const mapUrl = buildMapUrl(p.lat, p.lng, p.name);
          return (
            <li
              key={`${p.name}-${i}`}
              className="flex items-start gap-3 rounded-xl border border-line bg-cream p-4 dark:border-white/10 dark:bg-white/5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${meta.bg}`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink dark:text-white" title={p.name}>
                  {p.name}
                </p>
                <p className="truncate text-xs capitalize text-smoke dark:text-white/55">
                  {p.category}
                  {p.address ? ` · ${p.address}` : ""}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2">
                {p.rating ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-ink dark:text-white">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.rating}
                  </span>
                ) : null}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on map"
                    aria-label={`View ${p.name} on map`}
                    className="tcc-focus text-smoke transition-colors hover:text-clay"
                  >
                    <MapPinned className="h-4 w-4" />
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
