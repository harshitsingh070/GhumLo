import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import CategoryPanel from "./CategoryPanel.jsx";
import { photoFor } from "../lib/destinations.js";
import { placeMapUrl } from "../lib/format.js";
import { placeIdentity } from "../lib/places.js";

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

  // Favorites keyed by stable identity (provider ID or name+coords) —
  // never bare name, so same-named places favorite independently.
  const toggleFavorite = (place) => {
    const id = placeIdentity(place);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one actual card width (not a fixed 320px that overshoots).
    const card = el.querySelector(":scope > *");
    const w = card ? card.getBoundingClientRect().width + 12 : 220;
    el.scrollBy({ left: direction === "left" ? -w : w, behavior: "smooth" });
  };

  return (
    <section
      id="places"
      aria-label={`Popular Experiences in ${destination}`}
      className="min-w-0 flex-1 scroll-mt-24 overflow-hidden rounded-[24px] p-6 sm:p-7"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        color: "#102A43",
      }}
    >
      {/* ── Section Header ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2
          className="font-display min-w-0 t-section"
          style={{ color: "#102A43" }}
        >
          Popular Experiences in {destination || "Destination"}
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {/* Prev/Next arrows — 44px touch targets */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous experiences"
              className="tcc-focus tcc-touch flex items-center justify-center rounded-full transition-colors"
              style={{ background: "#F1F5F9", border: "1px solid #E5E7EB", color: "#3E5463" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2F6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next experiences"
              className="tcc-focus tcc-touch flex items-center justify-center rounded-full transition-colors"
              style={{ background: "#F1F5F9", border: "1px solid #E5E7EB", color: "#3E5463" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2F6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
            >
              <ChevronRight className="h-5 w-5" />
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
              className="tcc-focus tcc-touch rounded-full px-3.5 py-1.5 t-btn-sm transition-colors"
              style={{
                background: active ? "#FF6B57" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#52606D",
                border: active ? "1px solid transparent" : "1px solid #E5E7EB",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Carousel Track — snap + natural touch scroll ── */}
      <div
        ref={scrollRef}
        className="carousel-snap flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin" }}
        tabIndex={0}
        role="region"
        aria-label="Popular experiences carousel — use arrow keys to scroll"
      >
        {source.length === 0 && (
          <p className="py-3 t-meta" style={{ color: "#52606D" }}>
            No {filter === "restaurants" ? "restaurants" : "attractions"} in this plan yet.
          </p>
        )}
        {source.slice(0, 10).map((place, idx) => {
          const isFav = favorites.has(placeIdentity(place));
          const rating = place.rating;
          const isRestaurant = place.category === "restaurants";
          const categoryName = isRestaurant ? "Dining" : "Attraction";
          const categoryStyle = isRestaurant
            ? { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }
            : { background: "#ECFDF3", color: "#047857", border: "1px solid #A7F3D0" };
          const img = place.image || photoFor(destination, idx);
          const mapUrl = placeMapUrl(place);

          return (
            <div
              key={`${placeIdentity(place)}-${idx}`}
              className="group relative flex w-[200px] sm:w-[220px] shrink-0 flex-col overflow-hidden rounded-[18px] transition-all hover:-translate-y-1"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 32px rgba(15, 23, 42, 0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 23, 42, 0.06)"; }}
            >
              {/* Image container — taller than 4:3 for a more immersive card */}
              <div className="relative aspect-[16/11] w-full overflow-hidden" style={{ background: "#EEF2F6" }}>
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

                {/* Heart Button — 44px touch target */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(place);
                  }}
                  aria-label={isFav ? `Remove ${place.name} from favorites` : `Save ${place.name} to favorites`}
                  aria-pressed={isFav}
                  className="tcc-focus absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  <Heart
                    className="h-4 w-4 transition-colors"
                    style={{ color: isFav ? "#FF6B57" : "#FFFFFF", fill: isFav ? "#FF6B57" : "transparent" }}
                  />
                </button>
              </div>

              {/* Details — name and address both link to the map location */}
              <div className="p-3.5" style={{ background: "#FFFFFF" }}>
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${place.name} — view on map`}
                    aria-label={`View ${place.name} on map`}
                    className="tcc-focus block truncate t-activity transition-colors hover:underline"
                    style={{ color: "#102A43" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#102A43"; }}
                  >
                    {place.name}
                  </a>
                ) : (
                    <p className="truncate t-activity" style={{ color: "#102A43" }} title={place.name}>
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
                      className="block truncate t-meta-sm transition-colors"
                      style={{ color: "#5B6B7B" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#5B6B7B"; }}
                    >
                      {place.address}
                    </a>
                  ) : (
                    <p className="truncate t-meta-sm" style={{ color: "#5B6B7B" }} title={place.address}>
                      {place.address}
                    </p>
                  )
                )}
                <div className="mt-1.5 flex items-center justify-between t-meta-sm">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 t-badge-sm capitalize"
                    style={categoryStyle}
                  >
                    {categoryName}
                  </span>
                  {rating != null && rating !== "" && (
                    <span className="flex items-center gap-0.5 font-bold" style={{ color: "#F59E0B" }}>
                      {rating} <Star className="h-3 w-3" style={{ fill: "#F59E0B", color: "#F59E0B" }} />
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
