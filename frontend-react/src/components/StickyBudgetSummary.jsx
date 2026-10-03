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
  const accent = over ? "var(--coral)" : near ? "var(--gold)" : "var(--success)";
  const accentBorder = over
    ? "rgba(255,114,94,0.32)"
    : near
      ? "rgba(247,201,72,0.34)"
      : "rgba(67,209,124,0.28)";
  const diff = Math.abs(total - cap);
  const pct = cap > 0 ? Math.round((diff / cap) * 100) : 0;

  // Human dates ("10 Oct – 13 Oct 2026") — never raw ISO in the strip.
  const dates = fmtDateRange(plan?.departure_date, plan?.return_date) || null;

  return (
    <div
      className="sticky top-[86px] z-[60] flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] px-4 py-2.5 sm:px-5"
      style={{
        background: "rgba(5, 24, 32, 0.94)",
        border: `1px solid ${accentBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 10px 34px rgba(0,0,0,0.32)",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Budget state */}
      <span className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <span className="text-[13px] font-bold" style={{ color: accent }}>
          {over
            ? `${pct}% over budget · ${inr(diff)}`
            : near
              ? `⚠ Near your budget · ${inr(diff)} left`
              : `${inr(diff)} within budget`}
        </span>
      </span>

      {/* Trip identity */}
      {plan && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <span className="flex min-w-0 items-center gap-1.5 font-semibold" style={{ color: "var(--text-primary)" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--coral)" }} aria-hidden="true" />
            <span className="truncate">{plan.destination}</span>
          </span>
          {dates && (
            <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{dates}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {plan.travelers} traveler{Number(plan.travelers) === 1 ? "" : "s"}
          </span>
          {plan.live_search != null && (
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                background: plan.live_search ? "rgba(67,209,124,0.15)" : "rgba(255,255,255,0.08)",
                color: plan.live_search ? "var(--success)" : "var(--text-muted)",
              }}
            >
              {plan.live_search ? "● Live prices" : "○ Saved results"}
            </span>
          )}
          {plan.demo && (
            <span
              className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{ background: "rgba(247,201,72,0.15)", color: "var(--gold)" }}
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
            className="font-display text-lg font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            {inr(total)}
          </span>
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>/ {inr(cap)}</span>
        </span>
        <span className="no-print hidden sm:block">
          <PrintTripButton />
        </span>
      </div>
    </div>
  );
}
