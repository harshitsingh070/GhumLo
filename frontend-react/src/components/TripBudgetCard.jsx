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
  // §42 Budget States: within (green) · near budget (amber, ≤10% headroom) · over (coral)
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
      className="glass-panel flex scroll-mt-24 flex-col rounded-[24px] p-5 sm:p-6"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="font-display t-subsection"
            style={{ color: "#102A43" }}
          >
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
                stroke="#EEF2F6"
                strokeWidth={strokeWidth}
              />
              {/* Value Stroke */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={over ? "#FF6B57" : near ? "#F59E0B" : "#22C55E"}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="font-display t-price-md"
                style={{ color: "#102A43" }}
              >
                {inr(total)}
              </span>
              <span className="t-meta" style={{ color: "#829AB1" }}>
                of {inr(bgt)}
              </span>
            </div>
          </div>

          {/* Over / Near / Under Budget Tag */}
          <div className="mt-3 text-center">
            {over ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 t-btn"
                style={{ background: "#FFF1EE", color: "#F25542", border: "1px solid #FECACA" }}
              >
                {overPct > 0 ? `${overPct}% over budget (${inr(diff)})` : `Over budget (${inr(diff)})`}
              </span>
            ) : near ? (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 t-btn"
                style={{ background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FDE68A" }}
              >
                ⚠ Near your budget ({inr(diff)} left)
              </span>
            ) : (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 t-btn"
                style={{ background: "#ECFDF3", color: "#22C55E", border: "1px solid #A7F3D0" }}
              >
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
            style={{ background: "#F7F9FC", border: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "#EFF6FF", color: "#3B82F6" }}
              >
                <Plane className="h-4 w-4" />
              </span>
              <div>
                <p className="t-body-strong" style={{ color: "#102A43" }}>
                  Flight {flight_airline ? `(${flight_airline})` : ""}
                </p>
                <p className="t-meta-sm" style={{ color: "#829AB1" }}>
                  {flightShare}% of total
                </p>
              </div>
            </div>
            <span className="font-display t-price-sm" style={{ color: "#102A43" }}>
              {inr(flight)}
            </span>
          </div>

          {/* Hotel */}
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ background: "#F7F9FC", border: "1px solid #E5E7EB" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "#F5F3FF", color: "#8B5CF6" }}
              >
                <Hotel className="h-4 w-4" />
              </span>
              <div>
                <p className="t-body-strong" style={{ color: "#102A43" }}>
                  Hotel {hotel_nights ? `(${hotel_nights} nights)` : ""}
                </p>
                <p className="t-meta-sm" style={{ color: "#829AB1" }}>
                  {hotelShare}% of total
                </p>
              </div>
            </div>
            <span className="font-display t-price-sm" style={{ color: "#102A43" }}>
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
          className="btn-primary w-full py-3.5 t-btn shadow-lg"
          style={{
            background: "#FF6B57",
            color: "#FFFFFF",
            borderRadius: "14px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F25542"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#FF6B57"; }}
        >
          View Full Plan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
