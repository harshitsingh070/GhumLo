import { useMemo, useState } from "react";
import { Backpack, Check, Leaf, Share2, SlidersHorizontal } from "lucide-react";
import { formatStops, inr } from "../lib/format.js";

const MODE_LABELS = { saver: "Saver", balanced: "Balanced", comfort: "Comfort" };

function packingItems(plan) {
  const condition = String(plan?.weather?.condition || "").toLowerCase();
  const items = ["Passport or ID", "Phone charger", "Toiletries", "Comfortable walking shoes"];
  if (/rain|storm|shower/.test(condition)) items.push("Compact umbrella or rain jacket");
  if (/sun|clear|hot|humid/.test(condition)) items.push("Sunscreen, sunglasses, and a hat");
  if ((plan?.itinerary || []).some((day) => (day.places || []).some((p) => /beach|park|water/i.test(p.name || "")))) {
    items.push("Light day bag and reusable water bottle");
  }
  return items;
}

export default function SmartOptions({ plan, onSelectAlternative, recomputing }) {
  const [whatIfBudget, setWhatIfBudget] = useState(Number(plan?.budget) || 60000);
  const [copied, setCopied] = useState(false);
  const alternatives = Array.isArray(plan?.plan_alternatives) ? plan.plan_alternatives : [];
  const items = useMemo(() => packingItems(plan), [plan]);
  const alternativeTotals = alternatives.map((option) => Number(option.total_cost) || 0).filter(Boolean);
  const minimumOption = alternativeTotals.length ? Math.min(...alternativeTotals) : Number(plan?.best_pick?.total_cost) || 10000;
  const maximumOption = alternativeTotals.length ? Math.max(...alternativeTotals) : Number(plan?.best_pick?.total_cost) || 100000;
  const affordable = alternatives.filter((option) => option.total_cost <= whatIfBudget);
  const bestWhatIf = affordable[0] || alternatives[0];

  if (!plan) return null;

  const share = async () => {
    const best = plan.best_pick;
    const text = `${plan.destination} trip | ${plan.departure_date} to ${plan.return_date}\n${inr(best.total_cost)} total for ${plan.travelers} traveler(s)\n${best.flight.airline} + ${best.hotel.name}\n${(plan.itinerary || []).length}-day itinerary planned by GhoomLo`;
    const shareData = { title: `${plan.destination} trip plan`, text, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${window.location.href}`);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="smart" aria-label="Smart trip options" className="scroll-mt-24 space-y-4">
      {/* Alternatives Comparison */}
      <div
        className="glass-panel rounded-[24px] p-6 sm:p-7 text-white"
        style={{
          background: "rgba(9, 38, 48, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--coral)" }}>
              Travel Styles
            </p>
            <h2 className="font-display mt-0.5 text-xl font-extrabold text-white">
              Compare Travel Options
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Alternative configurations calculated from live options.
            </p>
          </div>
          <button
            type="button"
            onClick={share}
            className="btn-secondary h-9 gap-1.5 rounded-xl px-3.5 text-xs font-semibold"
            title="Copy trip summary"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {alternatives.map((option, index) => {
            const isCurrent = option.mode === plan.travel_mode;
            return (
              <div
                key={`${option.hotel?.name}-${option.flight?.airline}-${index}`}
                className="flex flex-col justify-between rounded-[18px] p-4 transition-all"
                style={{
                  background: isCurrent ? "rgba(255, 114, 94, 0.08)" : "rgba(255, 255, 255, 0.04)",
                  border: isCurrent
                    ? "1px solid rgba(255, 114, 94, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {MODE_LABELS[option.mode] || "Option"}
                  </span>
                  <p className="font-display mt-1 text-2xl font-black text-white">
                    {inr(option.total_cost)}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-200">
                    {option.hotel?.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {option.flight?.airline} · {formatStops(option.flight?.stops) || "—"} · {option.hotel?.rating || "-"}★
                  </p>
                  <span
                    className="mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      background: option.fits_budget ? "rgba(67, 209, 124, 0.15)" : "rgba(255, 114, 94, 0.15)",
                      color: option.fits_budget ? "var(--success)" : "var(--coral)",
                    }}
                  >
                    {option.fits_budget ? "Within budget" : "Over budget"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={recomputing || isCurrent}
                  onClick={() => onSelectAlternative?.(option)}
                  className={`tcc-focus mt-4 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-white/10 text-slate-400 cursor-default"
                      : "btn-primary"
                  }`}
                >
                  {isCurrent ? "Current option" : recomputing ? "Updating…" : `Switch to ${MODE_LABELS[option.mode] || "option"}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* What if budget slider */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="glass-panel rounded-[24px] p-6 sm:p-7 text-white"
          style={{
            background: "rgba(9, 38, 48, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-[var(--coral)]" />
            <h3 className="font-display text-lg font-bold text-white">
              What-If Budget Calculator
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            See which tier unlocks at different budget levels.
          </p>

          <input
            type="range"
            min={1000}
            max={Math.max(100000, maximumOption, Number(plan.budget) * 2)}
            step="1000"
            value={Math.min(whatIfBudget, Math.max(100000, maximumOption, Number(plan.budget) * 2))}
            onChange={(event) => setWhatIfBudget(Number(event.target.value))}
            className="mt-5 w-full accent-[var(--coral)]"
            aria-label="What-if budget"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Test budget</span>
            <strong className="text-white font-bold text-sm">{inr(whatIfBudget)}</strong>
          </div>

          {bestWhatIf && (
            <div
              className="mt-4 rounded-xl p-3 text-xs leading-relaxed text-slate-200"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              {bestWhatIf.total_cost <= whatIfBudget ? (
                <>
                  <strong className="text-[var(--teal)]">{inr(bestWhatIf.total_cost)}</strong> unlocks the {MODE_LABELS[bestWhatIf.mode] || "selected"} tier with {bestWhatIf.flight?.airline}.
                </>
              ) : (
                <>
                  The lowest found option is <strong className="text-[var(--coral)]">{inr(minimumOption)}</strong>; increase your budget to unlock it.
                </>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Packing Checklist */}
        <div
          className="glass-panel rounded-[24px] p-6 sm:p-7 text-white"
          style={{
            background: "rgba(9, 38, 48, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <Backpack className="h-5 w-5 text-[var(--teal)]" />
            <h3 className="font-display text-lg font-bold text-white">
              Trip-Ready Packing Notes
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Personalized items based on your destination's weather & activities.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-slate-200">
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--teal)]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <Leaf className="h-3 w-3 text-emerald-400" />
            Tailored to real conditions in {plan.destination}.
          </p>
        </div>
      </div>
    </section>
  );
}
