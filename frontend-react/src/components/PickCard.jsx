import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Hotel,
  MapPinned,
  Plane,
  Sparkles,
  Star,
} from "lucide-react";
import CategoryPanel from "./CategoryPanel.jsx";
import SafeImage from "./SafeImage.jsx";
import { buildMapUrl, formatStops, inr, placeMapUrl } from "../lib/format.js";
import { buildReasons } from "../lib/reasons.js";
import { DESTINATIONS, heroImageFor } from "../lib/destinations.js";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ""}`;
}

function fmtRange(d1, d2) {
  const y = String(d2 || "").slice(0, 4);
  return `${fmtDay(d1)} – ${fmtDay(d2)}${y ? ` ${y}` : ""}`;
}

/** "Your Trip" card — left panel of 3-column dashboard.
 *  Destination image, meta chips, flight+hotel summary, hotel picker.
 *  Props: best_pick, fits_budget, remaining_budget, budget, num_nights, live_search, insight, destination, departure_date, return_date, travelers, itinerary, hotel_options, selected_hotel_name, onSelectHotel, recomputing */
export default function PickCard({
  best_pick: best,
  fits_budget,
  remaining_budget,
  budget,
  num_nights,
  live_search,
  insight,
  destination,
  departure_date,
  return_date,
  travelers,
  itinerary,
  hotel_options,
  selected_hotel_name,
  onSelectHotel,
  recomputing,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const hotelMapUrl = placeMapUrl(best.hotel);
  const destinationMapUrl = buildMapUrl(null, null, destination);
  const reasons = buildReasons({ best_pick: best, fits_budget, remaining_budget, budget, itinerary });
  const nights = Number(num_nights) || 0;
  const people = Number(travelers) || 0;
  const options = Array.isArray(hotel_options) ? hotel_options : [];
  const effectiveHotel = selected_hotel_name ?? best.hotel.name;
  const isAuto = !selected_hotel_name;

  // Dynamic destination photo: live hotel shot from this search first,
  // then catalogue match / hash-picked photo (never a fixed fallback).
  const destMatch = DESTINATIONS.find(
    (d) => destination && String(destination).toLowerCase().includes(d.name.toLowerCase())
  );
  const hero = heroImageFor(destination, { best_pick: best });
  const destImg = hero.src;
  const destImgFallback = hero.fallback;
  const destAlt = destMatch?.alt || `${destination} destination`;

  return (
    <section
      id="results"
      aria-label="Your trip result"
      className="animate-fade-rise glass-panel flex scroll-mt-24 flex-col overflow-hidden rounded-[24px]"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <h2
          className="font-display min-w-0 truncate t-card-lg"
          style={{ color: "#102A43" }}
        >
          Your Trip to {destination || "Destination"}
        </h2>
      </div>

      {/* ── Destination image ── */}
      <div className="relative mx-4 h-44 overflow-hidden rounded-[16px]">
        {destImg ? (
          <SafeImage
            src={destImg}
            alt={destAlt}
            className="h-full w-full object-cover"
            fallback={<CategoryPanel category="hotel" className="h-full w-full" />}
            fallbackSrc={destImgFallback}
          />
        ) : (
          <CategoryPanel category="hotel" className="h-full w-full" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(15,23,42,0.42) 0%, rgba(15,23,42,0.08) 55%, transparent 100%)" }}
        />

        {/* Floating pill badges on image — right-padded so they can never
            slide under the Live/Cached badge; truncated instead of overlapping. */}
        <div className="absolute left-3 top-3 right-16 flex flex-wrap gap-1.5">
          <span
            className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 t-badge"
            style={{ background: "#FFFFFF", color: "#102A43", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
          >
            📅 {fmtRange(departure_date, return_date)}
          </span>
          {people > 0 && (
            <span
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 t-badge"
              style={{ background: "#FFFFFF", color: "#102A43", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
            >
              👤 {people} Traveler{people !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Live badge */}
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 t-badge-sm"
          style={{ background: "#FFFFFF", color: "#52606D", border: "1px solid #E5E7EB" }}
        >
          <Circle
            className="h-1.5 w-1.5"
            style={{ fill: live_search ? "#22C55E" : "#829AB1", color: live_search ? "#22C55E" : "#829AB1" }}
          />
          {live_search ? "Live" : "Cached"}
        </span>
      </div>

      {/* ── Trip Content — natural height; nothing scrolls or clips. */}
      <div className="flex flex-col p-5 sm:p-6">
        {/* Destination name and star rating */}
        <div className="flex items-center justify-between gap-2">
          <h3
            className="font-display min-w-0 truncate t-section"
            style={{ color: "#102A43" }}
          >
            {destinationMapUrl ? (
              <a
                href={destinationMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${destination} — view on map`}
                aria-label={`View ${destination} on map`}
                className="tcc-focus transition-colors hover:underline"
                style={{ color: "#102A43" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#102A43"; }}
              >
                {destination || "Trip Destination"}
              </a>
            ) : (
              destination || "Trip Destination"
            )}
          </h3>
          {best.hotel.rating && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 t-meta"
              style={{ background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FDE68A" }}
            >
              ★ {best.hotel.rating}
            </span>
          )}
        </div>

        {/* Short description — light quote box */}
        <p
          className="mt-2.5 rounded-[12px] px-3.5 py-3 t-body"
          style={{ background: "#F7F9FC", color: "#52606D", border: "1px solid #E5E7EB", borderLeft: "3px solid #FF6B57" }}
        >
          {insight || "A curated journey tailored to your preferences, combining prime stays, top sights, and local culture."}
        </p>

        {/* Why this trip fits — reasons only (insight lives above) */}
        {reasons.length > 0 && (
          <div
            className="mt-4 rounded-[14px] p-3"
            style={{ background: "#F7F9FC", border: "1px solid #E5E7EB" }}
          >
            <p className="flex items-center gap-1.5 t-badge uppercase" style={{ color: "#829AB1" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#FF6B57" }} />
              Why this trip fits
            </p>
            <ul className="mt-2 space-y-1.5">
              {reasons.slice(0, 3).map((r) => (
                <li key={r.key} className="flex items-start gap-2 t-meta" style={{ color: "#52606D" }}>
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "#ECFDF3" }}
                  >
                    <Check className="h-2.5 w-2.5" style={{ color: "#22C55E" }} />
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="my-4" style={{ borderTop: "1px solid #EEF2F6" }} />

        {/* ── Flight card ── */}
        <div
          className="mb-3 overflow-hidden rounded-[14px]"
          style={{ background: "#F7F9FC", border: "1px solid #E5E7EB" }}
        >
          {best.flight.image ? (
            <div className="flex h-14 items-center justify-center bg-white px-4" style={{ borderBottom: "1px solid #EEF2F6" }}>
              <SafeImage src={best.flight.image} alt={`${best.flight.airline} logo`} className="max-h-8 max-w-[140px] object-contain" />
            </div>
          ) : (
            <div className="flex h-10 items-center gap-2 px-4 pt-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "#EFF6FF", color: "#3B82F6" }}
              >
                <Plane className="h-4 w-4 shrink-0" />
              </span>
              <span className="t-badge uppercase" style={{ color: "#829AB1" }}>Flight</span>
            </div>
          )}
          <div className="px-4 pb-3 pt-2">
            <p className="t-body-strong" style={{ color: "#102A43" }}>
              {best.flight.airline}
            </p>
            <p className="t-meta" style={{ color: "#829AB1" }}>
              {best.flight.duration}{best.flight.duration ? " · " : ""}{formatStops(best.flight.stops)}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between">
              <p className="font-display t-price-md" style={{ color: "#102A43" }}>
                {inr(best.flight.price)}
              </p>
              {people > 1 && (
                <span className="t-meta-sm" style={{ color: "#829AB1" }}>
                  {inr(Math.round(best.flight.price / people))}/person
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Hotel card ── */}
        <div
          className="overflow-hidden rounded-[14px]"
          style={{ background: "#F7F9FC", border: "1px solid #E5E7EB" }}
        >
          {best.hotel.image ? (
            <SafeImage
              src={best.hotel.image}
              alt={`${best.hotel.name}`}
              className="h-16 w-full object-cover"
              fallback={<CategoryPanel category="hotel" className="h-16 w-full" />}
            />
          ) : (
            <div className="flex h-10 items-center gap-2 px-4 pt-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: "#F5F3FF", color: "#8B5CF6" }}
              >
                <Hotel className="h-4 w-4 shrink-0" />
              </span>
              <span className="t-badge uppercase" style={{ color: "#829AB1" }}>Hotel</span>
            </div>
          )}
          <div className="px-4 pb-3 pt-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {hotelMapUrl ? (
                  <a href={hotelMapUrl} target="_blank" rel="noopener noreferrer"
                    className="tcc-focus block truncate t-body-strong hover:underline"
                    style={{ color: "#102A43" }}>
                    {best.hotel.name}
                    <MapPinned className="ml-1 inline h-3 w-3" style={{ color: "#829AB1" }} />
                  </a>
                ) : (
                  <p className="truncate t-body-strong" style={{ color: "#102A43" }}>
                    {best.hotel.name}
                  </p>
                )}
                <p className="t-meta" style={{ color: "#829AB1" }}>
                  {nights} night{nights !== 1 ? "s" : ""} · {inr(best.hotel.price_per_night)}/night
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display t-price-md" style={{ color: "#102A43" }}>
                  {inr(best.hotel.total_price)}
                </p>
                {best.hotel.rating && (
                  <p className="t-meta-sm" style={{ color: "#829AB1" }}>
                    <Star className="inline h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />{best.hotel.rating}
                  </p>
                )}
              </div>
            </div>

            {/* Hotel options toggle */}
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => setShowOptions((s) => !s)}
                aria-expanded={showOptions}
                className="tcc-focus mt-2 inline-flex items-center gap-1 t-btn-sm"
                style={{ color: "#FF6B57" }}
              >
                {showOptions ? (
                  <>Fewer options <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>More options ({options.length}) <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Hotel picker ── */}
        {showOptions && options.length > 0 && (
          <div className="mt-3 animate-fade-rise rounded-[14px] p-3"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <p className="mb-2 t-meta" style={{ color: "#52606D" }}>
              More stays — picking one rebuilds the trip.
            </p>
            <ul className="space-y-1.5">
              {options.map((h) => {
                const selected = h.name === effectiveHotel;
                return (
                  <li key={h.name}>
                    <button
                      type="button"
                      onClick={() => onSelectHotel?.(h.name)}
                      disabled={recomputing || selected}
                      aria-pressed={selected}
                      className="tcc-focus flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left t-btn-sm transition-all"
                      style={{
                        border: selected ? "1px solid #FF6B57" : "1px solid #E5E7EB",
                        background: selected ? "#FFF1EE" : "#F7F9FC",
                        color: "#102A43",
                      }}
                    >
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-semibold">{h.name}</span>
                          {h.tier && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-px t-badge-sm"
                              title="Relative price within this destination's fetched hotels"
                              style={{
                                background:
                                  h.tier === "Higher-end"
                                    ? "#FFFBEB"
                                    : h.tier === "Budget"
                                      ? "#ECFDF3"
                                      : "#EFF6FF",
                                color:
                                  h.tier === "Higher-end"
                                    ? "#F59E0B"
                                    : h.tier === "Budget"
                                      ? "#22C55E"
                                      : "#3B82F6",
                                border:
                                  h.tier === "Higher-end"
                                    ? "1px solid #FDE68A"
                                    : h.tier === "Budget"
                                      ? "1px solid #A7F3D0"
                                      : "1px solid #BFDBFE",
                              }}
                            >
                              {h.tier}
                            </span>
                          )}
                        </span>
                        <span
                          className="block truncate t-meta-sm"
                          style={{ color: "#829AB1" }}
                        >
                          {h.rating ? `★ ${h.rating} · ` : ""}
                          {inr(h.price_per_night)}/night
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {selected && (
                          <span className="rounded-full px-2 py-0.5 t-badge-sm"
                            style={{ background: "#FF6B57", color: "#FFFFFF" }}>
                            {isAuto ? "Auto pick" : "Selected"}
                          </span>
                        )}
                        <strong className="whitespace-nowrap">{inr(h.total_price)}</strong>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {recomputing && (
              <p className="mt-2 t-meta-sm" role="status" style={{ color: "#829AB1" }}>Updating trip…</p>
            )}
          </div>
        )}

        {/* ── Itinerary jump link — secondary on purpose: the budget card
            already owns the primary "View Full Plan" CTA in this viewport. */}
        <div className="mt-auto pt-5">
          <a
            href="#itinerary"
            className="tcc-focus btn-secondary flex h-[44px] w-full items-center justify-center gap-2 t-btn"
          >
            View itinerary
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
