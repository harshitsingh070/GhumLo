import { ArrowRight, Plane, Moon } from "lucide-react";
import { inr, fmtDateRange } from "../lib/format.js";

/** Floating hero card — a live snapshot of the trip the user just planned.
 *  Purely presentational: every number comes from the plan response.
 *  Props: plan, onViewPlan. Returns null until a plan exists. */
export default function TripPreviewCard({ plan, onViewPlan }) {
  if (!plan?.best_pick) return null;

  const total = plan.best_pick.total_cost ?? 0;
  const budget = plan.budget ?? 0;
  const flight = plan.best_pick.flight?.price ?? 0;
  const hotel = plan.best_pick.hotel?.total_price ?? 0;
  const over = !plan.fits_budget;
  const near = !over && budget > 0 && budget - total <= budget * 0.1;
  const diff = Math.abs(total - budget);
  const pct = budget > 0 ? Math.round((diff / budget) * 100) : 0;
  const fill = budget > 0 ? Math.min(1, total / budget) : 0;

  return (
    <div
      className="animate-fade-rise w-full max-w-[360px] rounded-[24px] p-6 sm:p-7"
      style={{
        background: "rgba(6, 24, 32, 0.72)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow:
          "0 32px 90px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: "var(--text-muted)" }}
      >
        Your trip to {plan.destination || "your destination"}
      </p>

      <p className="mt-2.5 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
        {fmtDateRange(plan.departure_date, plan.return_date)}
      </p>
      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
        {plan.travelers} traveler{Number(plan.travelers) === 1 ? "" : "s"}
      </p>

      <div className="mt-4 flex items-end gap-2">
        <span
          className="font-display text-[34px] font-extrabold leading-none tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {inr(total)}
        </span>
        <span className="pb-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
          of {inr(budget)}
        </span>
      </div>

      {/* Budget meter */}
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.10)" }}
        role="img"
        aria-label={`${inr(total)} of ${inr(budget)} budget`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(4, Math.round(fill * 100))}%`,
            background: over ? "var(--coral)" : near ? "var(--gold)" : "var(--teal)",
          }}
        />
      </div>

      <p
        className="mt-2 text-[12px] font-bold"
        style={{ color: over ? "var(--coral)" : near ? "var(--gold)" : "var(--success)" }}
      >
        {over
          ? `${pct}% over budget · ${inr(diff)} above`
          : near
            ? `⚠ Near your budget · ${inr(diff)} left`
            : `${inr(diff)} under budget`}
      </p>

      <div className="mt-4 space-y-2">
        <Row icon={Plane} tint="coral" label="Flight" value={inr(flight)} />
        <Row icon={Moon} tint="teal" label="Hotel" value={inr(hotel)} />
      </div>

      <button
        type="button"
        onClick={onViewPlan}
        className="btn-primary mt-4 h-[42px] w-full rounded-[14px] text-[13px]"
      >
        View full plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function Row({ icon: Icon, tint, label, value }) {
  const color = tint === "coral" ? "var(--coral)" : "var(--teal)";
  return (
    <div className="flex items-center justify-between rounded-[12px] px-3 py-2"
      style={{ background: "rgba(255,255,255,0.06)" }}>
      <span className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
        {label}
      </span>
      <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
