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
  CreditCard,
  FileText,
} from "lucide-react";
import CategoryPanel from "./CategoryPanel.jsx";
import SafeImage from "./SafeImage.jsx";
import { buildMapUrl, formatStops, inr, placeMapUrl } from "../lib/format.js";
import { buildReasons } from "../lib/reasons.js";
import { DESTINATIONS } from "../lib/destinations.js";

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
 *  Props: best_pick, fits_budget, remaining_budget, budget, num_nights, live_search, insight, destination, departure_date, return_date, travelers, itinerary, hotel_options, selected_hotel_name, onSelectHotel, recomputing, weather, exchange_rate, know */
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
  weather,
  exchange_rate,
  know,
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

  // Currency from exchange_rate or default
  const currencyCode = exchange_rate?.currency || "INR";
  // Visa/entry guidance comes from the real `know` list — never a default.
  const visaKnow = Array.isArray(know)
    ? know.find((k) => /visa|entry|id requirement/i.test(String(k?.title || "")))
    : null;
  const visaText = visaKnow
    ? /visa/i.test(visaKnow.title)
      ? "Visa rules"
      : "Entry rules"
    : Array.isArray(know) && know.length
      ? "See good to know"
      : null;

  // Prefer a bundled cinematic destination photo; fall back to the hotel shot.
  const destMatch = DESTINATIONS.find(
    (d) => destination && String(destination).toLowerCase().includes(d.name.toLowerCase())
  );
  const destImg = destMatch?.img || best.hotel.image || null;
  const destAlt = destMatch?.alt || `${destination} destination`;

  return (
    <section
      id="results"
      aria-label="Your trip result"
      className="animate-fade-rise glass-panel flex scroll-mt-24 flex-col overflow-hidden rounded-[24px]"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <h2 className="font-display min-w-0 truncate text-lg font-bold tracking-tight text-white">
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
          />
        ) : (
          <CategoryPanel category="hotel" className="h-full w-full" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(6,27,36,0.85) 0%, rgba(6,27,36,0.2) 60%, transparent 100%)" }}
        />

        {/* Floating pill badges on image — right-padded so they can never
            slide under the Live/Cached badge; truncated instead of overlapping. */}
        <div className="absolute left-3 top-3 right-16 flex flex-wrap gap-1.5">
          <span
            className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", color: "#fff" }}
          >
            📅 {fmtRange(departure_date, return_date)}
          </span>
          {people > 0 && (
            <span
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", color: "#fff" }}
            >
              👤 {people} Traveler{people !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Live badge */}
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
        >
          <Circle className={`h-1.5 w-1.5 ${live_search ? "fill-emerald-400 text-emerald-400" : "fill-white/50 text-white/50"}`} />
          {live_search ? "Live" : "Cached"}
        </span>
      </div>

      {/* ── Trip Content — natural height; nothing scrolls or clips. */}
      <div className="flex flex-col p-5 sm:p-6">
        {/* Destination name and star rating */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display min-w-0 truncate text-2xl font-extrabold tracking-tight text-white">
            {destinationMapUrl ? (
              <a
                href={destinationMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${destination} — view on map`}
                aria-label={`View ${destination} on map`}
                className="tcc-focus transition-colors hover:text-[var(--coral)] hover:underline"
              >
                {destination || "Trip Destination"}
              </a>
            ) : (
              destination || "Trip Destination"
            )}
          </h3>
          {best.hotel.rating && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold"
              style={{ background: "rgba(247, 201, 72, 0.15)", color: "var(--gold)" }}
            >
              ★ {best.hotel.rating}
            </span>
          )}
        </div>

        {/* Short description */}
        <p className="mt-2.5 text-[14px] leading-relaxed text-slate-300">
          {insight || "A curated journey tailored to your preferences, combining prime stays, top sights, and local culture."}
        </p>

        {/* 3 Quick Stat Chips Row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {/* Weather */}
          <div
            className="flex flex-col items-center justify-center rounded-xl p-2.5 text-center"
            style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <span className="text-base" role="img" aria-label="Weather">☀</span>
            <span className="font-display text-[12px] font-bold text-white mt-1">
              {weather?.temperature
                ? `${weather.temperature}°${/f/i.test(String(weather.unit || "")) ? "F" : "C"}`
                : "—"}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-full">
              {weather?.condition || "Weather"}
            </span>
          </div>

          {/* Currency */}
          <div
            className="flex flex-col items-center justify-center rounded-xl p-2.5 text-center"
            style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <CreditCard className="h-4 w-4 text-[var(--teal)]" />
            <span className="font-display text-[12px] font-bold text-white mt-1">
              {currencyCode}
            </span>
            <span className="text-[10px] text-slate-400">
              Currency
            </span>
          </div>

          {/* Visa */}
          <div
            className="flex flex-col items-center justify-center rounded-xl p-2.5 text-center"
            style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
          >
            <FileText className="h-4 w-4 text-[var(--coral)]" />
            <span className="font-display text-[12px] font-bold text-white mt-1 truncate max-w-full">
              Visa
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-full">
              {visaText ? (visaText.length > 12 ? visaText.slice(0, 11) + "…" : visaText) : "—"}
            </span>
          </div>
        </div>

        {/* Why this trip fits — reasons only (insight lives above) */}
        {reasons.length > 0 && (
          <div
            className="mt-4 rounded-[14px] p-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--coral)" }} />
              Why this trip fits
            </p>
            <ul className="mt-2 space-y-1">
              {reasons.slice(0, 3).map((r) => (
                <li key={r.key} className="flex items-start gap-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <Check className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--success)" }} />
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Divider */}
        <div className="my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* ── Flight card ── */}
        <div
          className="mb-3 overflow-hidden rounded-[14px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {best.flight.image ? (
            <div className="flex h-14 items-center justify-center px-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <SafeImage src={best.flight.image} alt={`${best.flight.airline} logo`} className="max-h-8 max-w-[140px] object-contain" />
            </div>
          ) : (
            <div className="flex h-10 items-center gap-2 px-4 pt-3">
              <Plane className="h-4 w-4 shrink-0" style={{ color: "var(--coral)" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Flight</span>
            </div>
          )}
          <div className="px-4 pb-3 pt-2">
            <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
              {best.flight.airline}
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {best.flight.duration}{best.flight.duration ? " · " : ""}{formatStops(best.flight.stops)}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between">
              <p className="font-display text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                {inr(best.flight.price)}
              </p>
              {people > 1 && (
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {inr(Math.round(best.flight.price / people))}/person
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Hotel card ── */}
        <div
          className="overflow-hidden rounded-[14px]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
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
              <Hotel className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Hotel</span>
            </div>
          )}
          <div className="px-4 pb-3 pt-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {hotelMapUrl ? (
                  <a href={hotelMapUrl} target="_blank" rel="noopener noreferrer"
                    className="tcc-focus block truncate text-[13px] font-bold hover:underline"
                    style={{ color: "var(--text-primary)" }}>
                    {best.hotel.name}
                    <MapPinned className="ml-1 inline h-3 w-3" style={{ color: "var(--text-muted)" }} />
                  </a>
                ) : (
                  <p className="truncate text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                    {best.hotel.name}
                  </p>
                )}
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {nights} night{nights !== 1 ? "s" : ""} · {inr(best.hotel.price_per_night)}/night
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  {inr(best.hotel.total_price)}
                </p>
                {best.hotel.rating && (
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
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
                className="tcc-focus mt-2 inline-flex items-center gap-1 text-[12px] font-semibold"
                style={{ color: "var(--coral)" }}
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
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="mb-2 text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
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
                      className="tcc-focus flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] transition-all"
                      style={{
                        border: selected ? "1px solid var(--coral)" : "1px solid rgba(255,255,255,0.08)",
                        background: selected ? "rgba(255,114,94,0.08)" : "rgba(255,255,255,0.03)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-semibold">{h.name}</span>
                          {h.tier && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold"
                              title="Relative price within this destination's fetched hotels"
                              style={{
                                background:
                                  h.tier === "Higher-end"
                                    ? "rgba(247, 201, 72, 0.14)"
                                    : h.tier === "Budget"
                                      ? "rgba(67, 209, 124, 0.14)"
                                      : "rgba(32, 199, 201, 0.14)",
                                color:
                                  h.tier === "Higher-end"
                                    ? "var(--gold)"
                                    : h.tier === "Budget"
                                      ? "var(--success)"
                                      : "var(--teal)",
                              }}
                            >
                              {h.tier}
                            </span>
                          )}
                        </span>
                        <span
                          className="block truncate text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h.rating ? `★ ${h.rating} · ` : ""}
                          {inr(h.price_per_night)}/night
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {selected && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: "var(--coral)", color: "#fff" }}>
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
              <p className="mt-2 text-[11px]" role="status" style={{ color: "var(--text-muted)" }}>Updating trip…</p>
            )}
          </div>
        )}

        {/* ── Itinerary jump link — secondary on purpose: the budget card
            already owns the primary "View Full Plan" CTA in this viewport. */}
        <div className="mt-auto pt-5">
          <a
            href="#itinerary"
            className="tcc-focus btn-secondary flex h-[44px] w-full items-center justify-center gap-2 text-[14px]"
          >
            View itinerary
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
