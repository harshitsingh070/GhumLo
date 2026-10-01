import { useMemo, useState } from "react";
import { Backpack, Check, Clock3, Leaf, Share2, SlidersHorizontal } from "lucide-react";
import { inr } from "../lib/format.js";

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
    const text = `${plan.destination} trip | ${plan.departure_date} to ${plan.return_date}\n${inr(best.total_cost)} total for ${plan.travelers} traveler(s)\n${best.flight.airline} + ${best.hotel.name}\n${(plan.itinerary || []).length}-day itinerary planned by Trip Cost Compass`;
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
    <section id="smart" aria-label="Smart trip options" className="scroll-mt-36 space-y-4">
      <div className="rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">Smart options</p>
            <h2 className="font-display mt-1 text-xl font-extrabold tracking-tight text-ink dark:text-white">Compare the way you want to travel</h2>
            <p className="mt-1 text-sm text-smoke dark:text-white/55">These choices reuse the live results already fetched for this trip.</p>
          </div>
          <button type="button" onClick={share} className="tcc-focus inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-sand dark:border-white/15 dark:text-white dark:hover:bg-white/10" title="Copy trip summary">
            {copied ? <Check className="h-4 w-4 text-pine" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Share summary"}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-smoke dark:text-white/55">
          <Clock3 className="h-3.5 w-3.5 text-pine" />
          {plan.live_search ? "Live prices checked for this search" : "Using saved results from the local cache"}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {alternatives.map((option, index) => (
            <div key={`${option.hotel?.name}-${option.flight?.airline}-${index}`} className={`rounded-xl border p-4 ${index === 0 ? "border-clay bg-clay/5" : "border-line dark:border-white/10"}`}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-smoke dark:text-white/55">{MODE_LABELS[option.mode] || "Option"}</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-ink dark:text-white">{inr(option.total_cost)}</p>
              <p className="mt-1 truncate text-sm font-semibold text-ink dark:text-white">{option.hotel?.name}</p>
              <p className="mt-1 text-xs text-smoke dark:text-white/55">{option.flight?.airline} · {option.flight?.stops ?? 0} stop(s) · {option.hotel?.rating || "-"} star</p>
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${option.fits_budget ? "bg-pine/10 text-pine" : "bg-clay/10 text-clay"}`}>{option.fits_budget ? "Within budget" : "Over budget"}</span>
              <button
                type="button"
                disabled={recomputing || option.mode === plan.travel_mode}
                onClick={() => onSelectAlternative?.(option)}
                className="tcc-focus mt-3 block w-full rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-clay hover:text-clay disabled:cursor-default disabled:opacity-45 dark:border-white/15 dark:text-white dark:hover:border-clay"
              >
                {option.mode === plan.travel_mode ? "Current mode" : recomputing ? "Updating..." : `Use ${MODE_LABELS[option.mode] || "option"}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[18px] border border-line bg-white p-6 shadow-card dark:border-white/10 dark:bg-ink">
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-clay" /><h2 className="font-display text-xl font-extrabold text-ink dark:text-white">What if your budget changes?</h2></div>
          <p className="mt-1 text-sm text-smoke dark:text-white/55">Test the options without making another search.</p>
          <input type="range" min={1000} max={Math.max(100000, maximumOption, Number(plan.budget) * 2)} step="1000" value={Math.min(whatIfBudget, Math.max(100000, maximumOption, Number(plan.budget) * 2))} onChange={(event) => setWhatIfBudget(Number(event.target.value))} className="mt-5 w-full accent-clay" aria-label="What-if budget" />
          <div className="mt-2 flex justify-between text-sm"><span className="text-smoke">Test budget</span><strong className="text-ink dark:text-white">{inr(whatIfBudget)}</strong></div>
          {bestWhatIf ? <p className="mt-4 rounded-xl bg-sand p-3 text-sm text-ink dark:bg-white/5 dark:text-white/75">{bestWhatIf.total_cost <= whatIfBudget ? <><strong>{inr(bestWhatIf.total_cost)}</strong> unlocks the {MODE_LABELS[bestWhatIf.mode] || "selected"} plan with {bestWhatIf.flight?.airline}.</> : <>The cheapest returned option is <strong>{inr(minimumOption)}</strong>; increase the budget or change dates.</>}</p> : null}
        </div>

        <div className="rounded-[18px] border border-line bg-white p-6 shadow-card dark:border-white/10 dark:bg-ink">
          <div className="flex items-center gap-2"><Backpack className="h-5 w-5 text-pine" /><h2 className="font-display text-xl font-extrabold text-ink dark:text-white">Trip-ready packing list</h2></div>
          <p className="mt-1 text-sm text-smoke dark:text-white/55">Personalized from current conditions and your planned stops.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {items.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-ink dark:text-white/75"><Check className="h-4 w-4 shrink-0 text-pine" />{item}</li>)}
          </ul>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-smoke dark:text-white/50"><Leaf className="h-3.5 w-3.5" />Built from your actual itinerary, not a generic checklist.</p>
        </div>
      </div>
    </section>
  );
}
