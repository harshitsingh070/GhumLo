import { CalendarDays, MapPin, Users } from "lucide-react";
import { fmtDateRange, inr } from "../lib/format.js";
import PrintTripButton from "./PrintTripButton.jsx";

/** Compact sticky trip-status strip above the dashboard.
 *  Single source of truth for "where / when / how many / budget state" —
 *  it replaces the old separate results nav so budget is never repeated.
 *  Props: plan (full /api/plan response). */
export default function StickyBudgetSummary({ plan, total_cost, budget, fits_budget }) {
  const total = total_cost ?? plan?.best_pick?.total_cost ?? 0;
  const cap = budget ?? plan?.budget ?? 0;
  const fits = fits_budget ?? plan?.fits_budget;
  const over = !fits;
  const near = !over && cap > 0 && cap - total <= cap * 0.1;
  const accent = over ? "#F25542" : near ? "#F59E0B" : "#22C55E";
  const accentBg = over ? "#FFF1EE" : near ? "#FFFBEB" : "#ECFDF3";
  const accentBorder = over ? "#FECACA" : near ? "#FDE68A" : "#A7F3D0";
  const diff = Math.abs(total - cap);
  const pct = cap > 0 ? Math.round((diff / cap) * 100) : 0;

  // Human dates ("10 Oct – 13 Oct 2026") — never raw ISO in the strip.
  const dates = fmtDateRange(plan?.departure_date, plan?.return_date) || null;

  return (
    <div
      className="sticky top-[86px] z-[60] flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] px-4 py-2.5 sm:px-5"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Budget state */}
      <span className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 t-btn"
          style={{ background: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden="true"
          />
          {over
            ? `${pct}% over budget · ${inr(diff)}`
            : near
              ? `⚠ Near your budget · ${inr(diff)} left`
              : `${inr(diff)} within budget`}
        </span>
      </span>

      {/* Trip identity */}
      {plan && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 t-small">
          <span className="flex min-w-0 items-center gap-1.5 font-semibold" style={{ color: "#102A43" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#FF6B57" }} aria-hidden="true" />
            <span className="truncate">{plan.destination}</span>
          </span>
          {dates && (
            <span className="flex items-center gap-1.5" style={{ color: "#52606D" }}>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{dates}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5" style={{ color: "#52606D" }}>
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {plan.travelers} traveler{Number(plan.travelers) === 1 ? "" : "s"}
          </span>
          {plan.live_search != null && (
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-0.5 t-badge"
              style={
                plan.live_search
                  ? { background: "#ECFDF3", color: "#22C55E", border: "1px solid #A7F3D0" }
                  : { background: "#F1F5F9", color: "#829AB1", border: "1px solid #E5E7EB" }
              }
            >
              {plan.live_search ? "● Live prices" : "○ Saved results"}
            </span>
          )}
          {plan.demo && (
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-0.5 t-badge"
              style={{ background: "#FFFBEB", color: "#F59E0B", border: "1px solid #FDE68A" }}
            >
              Demo data · no API key used
            </span>
          )}
        </div>
      )}

      {/* Total + print */}
      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-baseline gap-1.5">
          <span
            className="font-display t-price-md"
            style={{ color: "#102A43" }}
          >
            {inr(total)}
          </span>
          <span className="t-small" style={{ color: "#829AB1" }}>/ {inr(cap)}</span>
        </span>
        <span className="no-print hidden sm:block">
          <PrintTripButton />
        </span>
      </div>
    </div>
  );
}
