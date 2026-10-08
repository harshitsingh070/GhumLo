/** Canonical budget model — single source of truth.
 *  Every budget UI must derive from getBudgetState, never recompute
 *  totals/percentages independently.
 *
 *  total: best_pick.total_cost (flight + hotel_total)
 *  cap: plan.budget
 *  status: over | near | under (near = <=10% headroom, not over)
 */
export function getBudgetState({ total, cap, fits_budget } = {}) {
  const t = Number(total) || 0;
  const c = Number(cap) || 0;
  const fits = fits_budget ?? !(c > 0 && t > c);
  const over = !fits || (c > 0 && t > c);
  const remaining = c - t;
  const diff = Math.abs(t - c);
  const pct = c > 0 ? Math.round((diff / c) * 100) : 0;
  const pctUsed = c > 0 ? Math.min(1, t / c) : 0;
  const near = !over && c > 0 && c - t <= c * 0.1;
  const status = over ? "over" : near ? "near" : "under";
  return { total: t, cap: c, fits: !over, over, near, status, remaining, diff, pct, pctUsed };
}

/** Build state directly from a full /api/plan response. */
export function budgetFromPlan(plan) {
  return getBudgetState({
    total: plan?.best_pick?.total_cost,
    cap: plan?.budget,
    fits_budget: plan?.fits_budget,
  });
}
