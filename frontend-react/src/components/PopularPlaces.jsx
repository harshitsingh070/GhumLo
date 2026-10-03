import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import CategoryPanel from "./CategoryPanel.jsx";
import { photoFor } from "../lib/destinations.js";
import { placeMapUrl } from "../lib/format.js";

/** Popular Experiences in Destination — Horizontal carousel matching reference design.
 *  4:3 image cards, heart button, title, category, rating, address + map link.
 *  Keeps the original All / Attractions / Restaurants filter. */
export default function PopularPlaces({ places, destination }) {
  const [favorites, setFavorites] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const scrollRef = useRef(null);

  const allPlaces = (Array.isArray(places) ? places : []).filter((p) => p && p.name);
  if (allPlaces.length === 0) return null;
  const allCount = allPlaces.length;
  const source = allPlaces
    .slice()
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .filter((p) =>
      filter === "all"
        ? true
        : filter === "attractions"
          ? p.category !== "restaurants"
          : p.category === "restaurants"
    );

  const toggleFavorite = (name) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section
      id="places"
      aria-label={`Popular Experiences in ${destination}`}
      className="glass-panel min-w-0 flex-1 scroll-mt-24 overflow-hidden rounded-[24px] p-6 sm:p-7 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      {/* ── Section Header ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="font-display min-w-0 text-xl font-bold tracking-tight text-white">
          Popular Experiences in {destination || "Destination"}
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {/* Prev/Next arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous experiences"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next experiences"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter popular places">
        {[
          ["all", `All ${allCount}`],
          ["attractions", "Attractions"],
          ["restaurants", "Restaurants"],
        ].map(([value, label]) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(value);
                scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
              }}
              className="tcc-focus rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors"
              style={{
                background: active ? "var(--coral)" : "transparent",
                color: active ? "#fff" : "var(--text-muted)",
                border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Carousel Track ── */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {source.length === 0 && (
          <p className="py-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
            No {filter === "restaurants" ? "restaurants" : "attractions"} in this plan yet.
          </p>
        )}
        {source.slice(0, 10).map((place, idx) => {
          const isFav = favorites.has(place.name);
          const rating = place.rating;
          const categoryName = place.category === "restaurants" ? "Dining" : "Attraction";
          const img = place.image || photoFor(destination, idx);
          const mapUrl = placeMapUrl(place);

          return (
            <div
              key={`${place.name}-${idx}`}
              className="group relative flex w-[200px] sm:w-[220px] shrink-0 flex-col overflow-hidden rounded-[18px] transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Image container — taller than 4:3 for a more immersive card */}
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-800">
                {img ? (
                  <SafeImage
                    src={img}
                    alt={place.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    fallback={<CategoryPanel category={place.category} className="h-full w-full" />}
                  />
                ) : (
                  <CategoryPanel category={place.category} className="h-full w-full" />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
                  }}
                />

                {/* Heart Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(place.name);
                  }}
                  aria-label={`Favorite ${place.name}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-colors ${
                      isFav ? "fill-[var(--coral)] text-[var(--coral)]" : "text-white"
                    }`}
                  />
                </button>
              </div>

              {/* Details — name and address both link to the map location */}
              <div className="p-3.5">
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${place.name} — view on map`}
                    aria-label={`View ${place.name} on map`}
                    className="tcc-focus block truncate text-[14px] font-bold text-white transition-colors hover:text-[var(--coral)] hover:underline"
                  >
                    {place.name}
                  </a>
                ) : (
                    <p className="truncate text-[14px] font-bold text-white" title={place.name}>
                    {place.name}
                  </p>
                )}
                {place.address && (
                  mapUrl ? (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      aria-hidden="true"
                      title={`${place.address} — view on map`}
                      className="block truncate text-[11px] text-slate-500 transition-colors hover:text-[var(--coral)]"
                    >
                      {place.address}
                    </a>
                  ) : (
                    <p className="truncate text-[11px] text-slate-500" title={place.address}>
                      {place.address}
                    </p>
                  )
                )}
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{categoryName}</span>
                  {rating != null && rating !== "" && (
                    <span className="flex items-center gap-0.5 font-bold text-amber-300">
                      {rating} <Star className="h-3 w-3 fill-amber-300" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
