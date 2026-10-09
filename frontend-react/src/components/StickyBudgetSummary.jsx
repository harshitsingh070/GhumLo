import { CalendarDays, MapPin, Users } from "lucide-react";
import { fmtDateRange, inr } from "../lib/format.js";
import { getBudgetState } from "../lib/budget.js";
import PrintTripButton from "./PrintTripButton.jsx";

/** Compact sticky trip-status strip above the dashboard.
 *  Consumes the canonical budget model — never computes its own totals.
 *  Props: plan + optional overrides (all routed through getBudgetState). */
export default function StickyBudgetSummary({ plan, total_cost, budget, fits_budget }) {
  const state = getBudgetState({
    total: total_cost ?? plan?.best_pick?.total_cost ?? 0,
    cap: budget ?? plan?.budget ?? 0,
    fits_budget: fits_budget ?? plan?.fits_budget,
  });
  const { total, cap, over, near, diff, pct } = state;
  const accent = over ? "var(--color-danger)" : near ? "var(--color-warning)" : "var(--color-success)";
  const accentBg = over ? "var(--color-danger-bg)" : near ? "var(--color-warning-bg)" : "var(--color-success-bg)";
  const accentBorder = over ? "var(--color-danger-border)" : near ? "var(--color-warning-border)" : "var(--color-success-border)";

  // Human dates ("10 Oct – 13 Oct 2026") — never raw ISO in the strip.
  const dates = fmtDateRange(plan?.departure_date, plan?.return_date) || null;

  return (
    <div
      className="sticky top-[76px] z-[60] flex max-h-[32vh] flex-wrap items-center gap-x-4 gap-y-2 overflow-y-auto rounded-[16px] px-4 py-2.5 sm:top-[86px] sm:max-h-none sm:overflow-visible sm:px-5"
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
              role="status"
              aria-label={
                plan.stale
                  ? "Stale cached prices from an earlier search"
                  : plan.live_search
                    ? "Live prices, freshly fetched"
                    : "Cached prices, saved results"
              }
              style={
                plan.stale
                  ? { background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning-border)" }
                  : plan.live_search
                    ? { background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" }
                    : { background: "#F1F5F9", color: "#3E5463", border: "1px solid #E5E7EB" }
              }
            >
              {plan.stale ? "○ Stale prices" : plan.live_search ? "● Live prices" : "○ Saved results"}
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
          <span className="t-small" style={{ color: "#5B6B7B" }}>/ {inr(cap)}</span>
        </span>
        <span className="no-print hidden sm:block">
          <PrintTripButton />
        </span>
      </div>
    </div>
  );
}
