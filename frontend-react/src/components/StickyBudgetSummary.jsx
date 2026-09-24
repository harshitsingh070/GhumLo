import { inr } from "../lib/format.js";

/** Compact sticky budget bar for the results area: total vs. budget with a
 *  clear over/within label. Same props as before.
 *  Props: total_cost, budget, fits_budget. */
export default function StickyBudgetSummary({ total_cost, budget, fits_budget }) {
  const over = !fits_budget;
  const diff = Math.abs(total_cost - budget);

  return (
    <div
      className={`sticky top-[76px] z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3 shadow-pop backdrop-blur-sm ${
        over
          ? "border-clay/30 bg-white/95 dark:border-clay/40 dark:bg-ink/95"
          : "border-pine/25 bg-white/95 dark:border-white/10 dark:bg-ink/95"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${over ? "bg-clay" : "bg-pine"}`}
          aria-hidden="true"
        />
        <span className={`text-[15px] font-bold ${over ? "text-clay-dark" : "text-pine"}`}>
          {over ? `${inr(diff)} over budget` : `${inr(diff)} within budget`}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-xl font-extrabold text-ink dark:text-white">
          {inr(total_cost)}
        </span>
        <span className="text-sm text-smoke dark:text-white/55">/ {inr(budget)}</span>
      </div>
    </div>
  );
}
