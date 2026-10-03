import { Plane, Hotel, ArrowRight } from "lucide-react";
import { inr } from "../lib/format.js";

/** TripBudgetCard — Right column of the 3-column dashboard.
 *  Features an SVG donut gauge, budget progress, flight & hotel breakdown,
 *  and a prominent coral CTA button matching the reference design. */
export default function TripBudgetCard({
  flight_price,
  hotel_total,
  total_cost,
  budget,
  fits_budget,
  flight_airline,
  hotel_nights,
  onViewFullPlan,
}) {
  const flight = Number(flight_price) || 0;
  const hotel = Number(hotel_total) || 0;
  const total = Number(total_cost) || flight + hotel;
  const bgt = Number(budget) || 1;
  const over = !fits_budget || total > bgt;
  // §42 Budget States: within (teal) · near budget (gold, ≤10% headroom) · over (coral)
  const near = !over && bgt > 0 && bgt - total <= bgt * 0.1;
  const diff = Math.abs(total - bgt);
  const overPct = bgt > 0 ? Math.round(((total - bgt) / bgt) * 100) : 0;

  const flightShare = total > 0 ? Math.round((flight / total) * 100) : 0;
  const hotelShare = total > 0 ? 100 - flightShare : 0;

  // Circular gauge calculations
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Cap visual fill so over-budget reads as a full ring, not overflow
  const fillPct = Math.min(1, total / bgt);
  const strokeDashoffset = circumference - fillPct * circumference;

  return (
    <section
      id="trip-budget-card"
      aria-label="Trip Budget"
      className="glass-panel flex scroll-mt-24 flex-col rounded-[24px] p-5 sm:p-6 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Trip Budget
          </h2>
        </div>

        {/* Circular Donut Gauge */}
        <div className="relative my-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
              className="h-full w-full -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
              />
              {/* Value Stroke */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={over ? "var(--coral)" : near ? "var(--gold)" : "var(--teal)"}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-2xl font-black tracking-tight text-white">
                {inr(total)}
              </span>
              <span className="text-[12px] font-medium text-slate-400">
                of {inr(bgt)}
              </span>
            </div>
          </div>

          {/* Over / Near / Under Budget Tag */}
          <div className="mt-3 text-center">
            {over ? (
              <span className="text-[13px] font-bold" style={{ color: "var(--coral)" }}>
                {overPct > 0 ? `${overPct}% over budget (${inr(diff)})` : `Over budget (${inr(diff)})`}
              </span>
            ) : near ? (
              <span className="text-[13px] font-bold" style={{ color: "var(--gold)" }}>
                ⚠ Near your budget ({inr(diff)} left)
              </span>
            ) : (
              <span className="text-[13px] font-bold" style={{ color: "var(--success)" }}>
                ✓ Within budget ({inr(diff)} left)
              </span>
            )}
          </div>
        </div>

        {/* Itemized Breakdown Rows */}
        <div className="space-y-4 pt-2">
          {/* Flight */}
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(255, 114, 94, 0.15)", color: "var(--coral)" }}
              >
                <Plane className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  Flight {flight_airline ? `(${flight_airline})` : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  {flightShare}% of total
                </p>
              </div>
            </div>
            <span className="font-display text-[14px] font-bold text-white">
              {inr(flight)}
            </span>
          </div>

          {/* Hotel */}
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(32, 199, 201, 0.15)", color: "var(--teal)" }}
              >
                <Hotel className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-white">
                  Hotel {hotel_nights ? `(${hotel_nights} nights)` : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  {hotelShare}% of total
                </p>
              </div>
            </div>
            <span className="font-display text-[14px] font-bold text-white">
              {inr(hotel)}
            </span>
          </div>
        </div>
      </div>

      {/* View Full Plan Button */}
      <div className="pt-6">
        <button
          type="button"
          onClick={() => {
            if (onViewFullPlan) onViewFullPlan();
            else document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="btn-primary w-full py-3.5 text-[14px] font-bold shadow-lg"
          style={{
            background: "var(--coral)",
            borderRadius: "14px",
          }}
        >
          View Full Plan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
