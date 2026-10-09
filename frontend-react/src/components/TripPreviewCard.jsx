import { ArrowRight, Plane, Moon, Star } from "lucide-react";
import { inr, fmtDateRange } from "../lib/format.js";
import { budgetFromPlan } from "../lib/budget.js";

/** Destination summary card — consumes canonical budget, never recomputes.
 *  Purely presentational: every number comes from getBudgetState(plan).
 *  Props: plan, onViewPlan. Returns null until a plan exists. */
export default function TripPreviewCard({ plan, onViewPlan }) {
  if (!plan?.best_pick) return null;

  const { total, cap: budget, over, near, diff, pct, pctUsed } = budgetFromPlan(plan);
  const flight = plan.best_pick.flight?.price ?? 0;
  const hotel = plan.best_pick.hotel?.total_price ?? 0;
  const fill = pctUsed;
  const rating = plan.best_pick.hotel?.rating;

  return (
    <div
      className="animate-fade-rise w-full max-w-[360px] rounded-[20px] p-6"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="t-badge-sm uppercase"
          style={{ color: "#5B6B7B" }}
        >
          {plan.destination || "Your destination"}
        </p>
        {rating && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 t-badge"
            style={{ background: "#FFFBEB", color: "#F59E0B" }}
          >
            <Star className="h-3 w-3 fill-current" /> {rating}
          </span>
        )}
      </div>

      <p className="mt-2 t-body-strong" style={{ color: "#102A43" }}>
        {fmtDateRange(plan.departure_date, plan.return_date)}
      </p>
      <p className="t-meta" style={{ color: "#5B6B7B" }}>
        {plan.travelers} traveler{Number(plan.travelers) === 1 ? "" : "s"}
      </p>

      <div className="mt-4 flex items-end gap-2">
        <span
          className="font-display t-price-lg"
          style={{ color: "#102A43" }}
        >
          {inr(total)}
        </span>
        <span className="pb-0.5 t-meta" style={{ color: "#5B6B7B" }}>
          of {inr(budget)}
        </span>
      </div>

      {/* Budget meter — text below carries meaning, bar is decorative */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "#EEF2F6" }}
        role="presentation"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(4, Math.round(fill * 100))}%`,
            background: over ? "var(--color-danger)" : near ? "var(--color-warning)" : "var(--color-success)",
          }}
        />
      </div>

      <p
        className="mt-2 rounded-lg px-2.5 py-1.5 t-meta"
        role="status"
        style={
          over
            ? { background: "var(--color-danger-bg)", color: "var(--color-danger)" }
            : near
              ? { background: "var(--color-warning-bg)", color: "var(--color-warning)" }
              : { background: "var(--color-success-bg)", color: "var(--color-success)" }
        }
      >
        {over
          ? `${pct}% over budget · ${inr(diff)} above`
          : near
            ? `Near budget · ${inr(diff)} left`
            : `${inr(diff)} under budget`}
      </p>

      {plan.insight && (
        <p className="mt-2 t-small" style={{ color: "#52606D" }}>
          {plan.insight}
        </p>
      )}

      <div className="mt-4 space-y-2">
        <Row icon={Plane} bg="#EFF6FF" fg="#3B82F6" label="Flight" value={inr(flight)} />
        <Row icon={Moon} bg="#F5F3FF" fg="#8B5CF6" label="Hotel" value={inr(hotel)} />
      </div>

      <button
        type="button"
        onClick={onViewPlan}
        className="btn-primary mt-4 h-[44px] w-full rounded-[12px] t-btn"
      >
        View full itinerary <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function Row({ icon: Icon, bg, fg, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-[12px] px-3 py-2"
      style={{ background: "#F7F9FC", border: "1px solid #EEF2F6" }}>
      <span className="flex items-center gap-2 t-meta" style={{ color: "#52606D" }}>
        <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: bg, color: fg }}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {label}
      </span>
      <span className="t-price-sm" style={{ color: "#102A43" }}>
        {value}
      </span>
    </div>
  );
}
