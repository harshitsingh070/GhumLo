import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
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
import { buildMapUrl, inr } from "../lib/format.js";
import { buildReasons } from "../lib/reasons.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "10 Oct" from "2026-10-10" (display-only; falls back to raw on bad input). */
function fmtDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ""}`;
}

/** "10 Oct – 13 Oct 2026" style range (display-only). */
function fmtRange(d1, d2) {
  const y = String(d2 || "").slice(0, 4);
  return `${fmtDay(d1)} – ${fmtDay(d2)}${y ? ` ${y}` : ""}`;
}

/** Best-match trip result: summary header, total + budget share, "why" panel,
 *  flight/hotel cards, hotel picker. Same data flow and callbacks as before —
 *  only the visual language is new.
 *  Props: best_pick, fits_budget, remaining_budget, budget, num_nights,
 *  live_search, insight, destination, departure_date, return_date,
 *  travelers, itinerary, hotel_options, selected_hotel_name (echo, null =
 *  auto), onSelectHotel(name), recomputing. */
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
  const over = !fits_budget;
  const [showOptions, setShowOptions] = useState(false);
  const hotelMapUrl = buildMapUrl(best.hotel.lat, best.hotel.lng, best.hotel.name);
  const reasons = buildReasons({ best_pick: best, fits_budget, remaining_budget, budget, itinerary });
  const nights = Number(num_nights) || 0;
  const people = Number(travelers) || 0;
  const options = Array.isArray(hotel_options) ? hotel_options : [];
  // Server-confirmed effective hotel: explicit echo, else the auto best pick.
  const effectiveHotel = selected_hotel_name ?? best.hotel.name;
  const isAuto = !selected_hotel_name;
  const pct = budget > 0 ? Math.min(100, Math.round((best.total_cost / budget) * 100)) : 0;

  return (
    <section
      id="results"
      aria-label="Your trip result"
      className="animate-fade-rise scroll-mt-24 overflow-hidden rounded-[20px] border border-line bg-white shadow-card dark:border-white/10 dark:bg-ink"
    >
      {/* ── Trip summary header ── */}
      <div className="bg-ink px-6 py-6 text-white sm:px-8 dark:bg-white/5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Your trip</p>
        <h2 className="font-display mt-1.5 text-2xl font-extrabold tracking-tight sm:text-[28px]">
          {destination || "Your trip"}
        </h2>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
          <span>{fmtRange(departure_date, return_date)}</span>
          {people ? <span>{people} traveler{people === 1 ? "" : "s"}</span> : null}
          <span>Budget {inr(budget)}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              over ? "bg-clay text-white" : "bg-pine text-white"
            }`}
          >
            {over ? "Over budget" : "Within budget"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
            <Circle className={`h-2 w-2 ${live_search ? "fill-emerald-300 text-emerald-300" : "text-white/50"}`} />
            {live_search ? "Live prices" : "Saved results"}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* ── Best match total ── */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
              Best match · Flight + Hotel
            </p>
            <p className="font-display mt-1 text-4xl font-extrabold tracking-tight text-ink sm:text-[44px] dark:text-white">
              {inr(best.total_cost)}{" "}
              <span className="text-base font-semibold text-smoke dark:text-white/60">total</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`font-display text-2xl font-extrabold ${over ? "text-clay" : "text-pine"}`}>
              {pct}%
            </p>
            <p className="text-xs text-smoke dark:text-white/55">of budget</p>
          </div>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-sand dark:bg-white/10"
          role="img"
          aria-label={`Trip total is ${pct} percent of budget`}
        >
          <div
            className={`h-full rounded-full ${over ? "bg-clay" : "bg-pine"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {over ? (
          <p className="mt-3 flex items-start gap-2 text-[15px] text-ink/80 dark:text-white/75">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
            <span>
              This exceeds your budget by <strong>{inr(best.over_by)}</strong> — try raising the
              budget, fewer travelers, or different dates.
            </span>
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-[15px] text-ink/80 dark:text-white/75">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-pine" />
            <span>
              Budget remaining: <strong>{inr(remaining_budget)}</strong>
            </span>
          </p>
        )}

        {/* ── Why this trip ── */}
        {(!!insight || reasons.length > 0) && (
          <div className="mb-6 mt-6 rounded-2xl bg-sand px-5 py-4 dark:bg-white/5">
            <h3 className="text-sm font-bold text-ink dark:text-white">Why we picked this trip</h3>
            {!!insight && (
              <p className="mb-2 mt-1.5 text-[15px] font-medium text-ink/85 dark:text-white/80">
                <Sparkles className="mr-1.5 inline h-4 w-4 text-clay" />
                {insight}
              </p>
            )}
            <ul className="space-y-1">
              {reasons.map((r) => (
                <li key={r.key} className="flex items-start gap-2 text-sm text-ink/80 dark:text-white/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
                  {r.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Flight + hotel cards ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-line dark:border-white/10">
            {best.flight.image ? (
              <div className="flex h-24 items-center justify-center bg-sand px-6 dark:bg-white/5">
                <SafeImage
                  src={best.flight.image}
                  alt={`${best.flight.airline} logo`}
                  className="max-h-12 max-w-[180px] object-contain"
                />
              </div>
            ) : <CategoryPanel category="flight" className="h-24 w-full" />}
            <div className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
                Flight
              </p>
              <p className="mb-1 text-[15px]">
                <Plane className="mr-1.5 inline h-4 w-4 text-smoke" />
                <strong className="text-ink dark:text-white">{best.flight.airline}</strong>
              </p>
              <p className="mb-1 text-sm text-smoke dark:text-white/60">
                {best.flight.duration} · {best.flight.stops} stop(s)
              </p>
              <p className="mb-3 text-sm text-smoke dark:text-white/60">
                {fmtRange(departure_date, return_date)}
                {people ? ` · ${people} traveler${people === 1 ? "" : "s"}` : ""}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="font-display text-xl font-extrabold text-ink dark:text-white">
                  {inr(best.flight.price)}
                </p>
                {people > 1 && (
                  <span className="text-xs font-medium text-smoke dark:text-white/55">
                    {inr(Math.round(best.flight.price / people))} per person
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line dark:border-white/10">
            {best.hotel.image ? (
              <SafeImage
                src={best.hotel.image}
                alt={`${best.hotel.name} hotel`}
                className="h-24 w-full object-cover"
                fallback={<CategoryPanel category="hotel" className="h-24 w-full" />}
              />
            ) : <CategoryPanel category="hotel" className="h-24 w-full" />}
            <div className="p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
                Hotel · {nights} night{nights === 1 ? "" : "s"}
              </p>
              <p className="mb-1 text-[15px]">
                <Hotel className="mr-1.5 inline h-4 w-4 text-smoke" />
                {hotelMapUrl ? (
                  <a
                    href={hotelMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View hotel on map"
                    aria-label={`View ${best.hotel.name} on map`}
                    className="tcc-focus font-bold text-ink underline-offset-2 hover:text-clay hover:underline dark:text-white"
                  >
                    {best.hotel.name}
                    <MapPinned className="ml-1 inline h-3.5 w-3.5 text-smoke" />
                  </a>
                ) : (
                  <strong className="text-ink dark:text-white">{best.hotel.name}</strong>
                )}{" "}
                {best.hotel.rating ? (
                  <span className="text-sm text-smoke dark:text-white/60">
                    <Star className="inline h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {best.hotel.rating}
                  </span>
                ) : null}
              </p>
              <p className="mb-2 text-sm text-smoke dark:text-white/60">
                {inr(best.hotel.price_per_night)}/night × {nights} night{nights === 1 ? "" : "s"}
              </p>
              <p className="font-display text-xl font-extrabold text-ink dark:text-white">
                {inr(best.hotel.total_price)}
              </p>

              {options.length > 0 && (
                <div className="mt-3 border-t border-line pt-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowOptions((s) => !s)}
                    aria-expanded={showOptions}
                    className="tcc-focus inline-flex items-center gap-1 text-sm font-semibold text-clay hover:text-clay-dark"
                  >
                    {showOptions ? (
                      <>See fewer options <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>See more options ({options.length}) <ChevronDown className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── More stays: full-width panel so the two cards stay balanced ── */}
        {showOptions && options.length > 0 && (
          <div className="animate-fade-rise rounded-2xl bg-cream p-4 sm:p-5 dark:bg-white/5">
            <p className="mb-3 text-sm font-semibold text-ink dark:text-white">
              More stays for these dates — picking one rebuilds the trip around it.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {options.map((h) => {
                const selected = h.name === effectiveHotel;
                return (
                  <li key={h.name}>
                    <button
                      type="button"
                      onClick={() => onSelectHotel?.(h.name)}
                      disabled={recomputing || selected}
                      aria-pressed={selected}
                      className={`tcc-focus flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-colors dark:bg-ink ${
                        selected
                          ? "border-clay shadow-sm dark:border-clay"
                          : "border-line hover:border-ink/25 disabled:opacity-60 dark:border-white/10 dark:hover:border-white/25"
                      } ${recomputing && !selected ? "cursor-wait" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink dark:text-white">{h.name}</span>
                        <span className="block text-xs text-smoke dark:text-white/55">
                          {h.rating ? `${h.rating}★ · ` : ""}
                          {inr(h.price_per_night)}/night
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {h.tier && (
                          <span
                            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              h.tier === "Budget"
                                ? "bg-pine/10 text-pine dark:bg-pine/20 dark:text-emerald-300"
                                : h.tier === "Higher-end"
                                  ? "bg-clay/10 text-clay-dark dark:bg-clay/15 dark:text-clay"
                                  : "bg-sand text-ink dark:bg-white/10 dark:text-white/80"
                            }`}
                            title={`Relative price within this destination's fetched hotels`}
                          >
                            {h.tier}
                          </span>
                        )}
                        {selected && (
                          <span className="rounded-full bg-clay px-2 py-0.5 text-[10px] font-bold text-white">
                            {isAuto ? "Auto pick" : "Selected"}
                          </span>
                        )}
                        <strong className="whitespace-nowrap text-ink dark:text-white">
                          {inr(h.total_price)}
                        </strong>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {recomputing && (
              <p className="mt-2.5 text-xs text-smoke dark:text-white/55" role="status">
                Updating trip…
              </p>
            )}
          </div>
        )}

        <a
          href="#itinerary"
          className="tcc-focus mt-6 inline-flex h-[48px] items-center gap-2 rounded-xl bg-clay px-6 text-[15px] font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
        >
          View trip
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
