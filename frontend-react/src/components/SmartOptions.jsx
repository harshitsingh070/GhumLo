import { useEffect, useState } from "react";
import { Check, Share2, SlidersHorizontal } from "lucide-react";
import { fmtDateRange, formatStops, inr } from "../lib/format.js";
import { friendlyError } from "../lib/api.js";

const MODE_LABELS = { saver: "Saver", balanced: "Balanced", comfort: "Comfort" };
const MODE_WHY = {
  saver: "Cheapest total found",
  balanced: "Best cost–comfort mix",
  comfort: "Highest-rated stay",
};

export default function SmartOptions({ plan, onSelectAlternative, recomputing }) {
  const [whatIfBudget, setWhatIfBudget] = useState(Number(plan?.budget) || 60000);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");
  // Resync the slider when a new plan loads — otherwise the thumb position
  // (clamped in render) disagrees with the label (raw state).
  useEffect(() => {
    setWhatIfBudget(Number(plan?.budget) || 60000);
    setShareError("");
  }, [plan?.budget, plan?.destination, plan?.departure_date]);
  const alternatives = Array.isArray(plan?.plan_alternatives) ? plan.plan_alternatives : [];
  const alternativeTotals = alternatives.map((option) => Number(option.total_cost) || 0).filter(Boolean);
  const minimumOption = alternativeTotals.length ? Math.min(...alternativeTotals) : Number(plan?.best_pick?.total_cost) || 10000;
  const maximumOption = alternativeTotals.length ? Math.max(...alternativeTotals) : Number(plan?.best_pick?.total_cost) || 100000;
  const affordable = alternatives.filter((option) => option.total_cost <= whatIfBudget);
  const bestWhatIf = affordable[0] || alternatives[0];
  // Genuinely one combination in the live data → all tiers repeat it.
  const allSameTier = alternativeTotals.length >= 2 && alternativeTotals.every((t) => t === alternativeTotals[0]);
  const flightCount = Number(plan?.counts?.flights) || 0;
  const hotelCount = Number(plan?.counts?.hotels) || 0;

  if (!plan) return null;

  const share = async () => {
    // Text-only summary (same as TripPage): the app URL can carry hash
    // queries, so it is never pasted into shared text.
    const best = plan.best_pick;
    const dates = fmtDateRange(plan.departure_date, plan.return_date) || "dates";
    const text = `${plan.destination} trip (${dates})\n${inr(best.total_cost)} total for ${plan.travelers} traveler(s)\n${best.flight.airline} + ${best.hotel.name}\n${(plan.itinerary || []).length}-day itinerary planned by GhoomLo`;
    setShareError("");
    try {
      if (navigator.share) {
        await navigator.share({ title: `${plan.destination} trip plan`, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      setCopied(false);
      setShareError(friendlyError(err, "Sharing failed — copy the summary manually."));
    }
  };

  return (
    <section id="smart" aria-label="Smart trip options" className="scroll-mt-24 space-y-4">
      {/* Alternatives Comparison */}
      <div
        className="rounded-[24px] p-6 sm:p-7"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          color: "#102A43",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="t-badge uppercase" style={{ color: "#FF6B57" }}>
              Travel Styles
            </p>
            <h2 className="font-display mt-0.5 t-section" style={{ color: "#102A43" }}>
              Compare Travel Options
            </h2>
            <p className="mt-1 t-small" style={{ color: "#52606D" }}>
              {flightCount && hotelCount
                ? `Saver = cheapest total · Balanced = cost–comfort mix · Comfort = highest-rated stay — from ${flightCount} flights × ${hotelCount} hotels.`
                : "Saver = cheapest total · Balanced = cost–comfort mix · Comfort = highest-rated stay."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={share}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 t-btn-sm transition-colors"
              style={{ background: "#F1F5F9", border: "1px solid #E5E7EB", color: "#102A43" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#EEF2F6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
              title="Copy trip summary"
            >
              {copied ? <Check className="h-3.5 w-3.5" style={{ color: "#22C55E" }} /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share"}
            </button>
            {shareError && (
              <p className="t-meta-sm" role="alert" style={{ color: "var(--color-danger)" }}>
                {shareError}
              </p>
            )}
          </div>
        </div>

        {allSameTier && (
          <p
            className="mt-4 rounded-xl p-3 t-meta"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
            role="note"
          >
            Only one flight + hotel combination was found for these dates, so all three tiers show
            the same price. Try different dates or airports for more choice.
          </p>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {alternatives.map((option, index) => {
            const isCurrent = option.mode === plan.travel_mode;
            const gap = maximumOption - (Number(option.total_cost) || 0);
            const noOp = allSameTier && !isCurrent;
            return (
              <div
                key={`${option.hotel?.name}-${option.flight?.airline}-${index}`}
                className="flex flex-col justify-between rounded-[18px] p-4 transition-all"
                style={{
                  background: isCurrent ? "#FFF1EE" : "#FFFFFF",
                  border: isCurrent
                    ? "1.5px solid #FF6B57"
                    : "1px solid #E5E7EB",
                  boxShadow: isCurrent
                    ? "0 4px 20px rgba(15, 23, 42, 0.06)"
                    : "none",
                }}
              >
                <div>
                  <span
                    className="inline-flex items-center gap-1 t-badge uppercase"
                    style={{ color: isCurrent ? "#FF6B57" : "#5B6B7B" }}
                  >
                    {isCurrent && <Check className="h-3.5 w-3.5" style={{ color: "#FF6B57" }} aria-hidden="true" />}
                    {MODE_LABELS[option.mode] || "Option"}
                  </span>
                  <p className="font-display mt-1 t-price-md" style={{ color: "#102A43" }}>
                    {inr(option.total_cost)}
                  </p>
                  <p className="mt-1 t-meta-sm" style={{ color: "#15803D" }}>
                    {MODE_WHY[option.mode] || ""}
                    {gap > 0 ? ` · ${inr(gap)} less than top tier` : ""}
                  </p>
                  <p className="mt-1 truncate t-label" style={{ color: "#102A43" }}>
                    {option.hotel?.name}
                  </p>
                  <p className="mt-0.5 t-meta-sm" style={{ color: "#5B6B7B" }}>
                    {option.flight?.airline} · {formatStops(option.flight?.stops) || "—"} · {option.hotel?.rating || "-"}★
                  </p>
                  <p className="mt-0.5 t-meta-sm" style={{ color: "#5B6B7B" }}>
                    {inr(option.flight?.price)} flight + {inr(option.hotel?.total_price)} hotel
                  </p>
                  <span
                    className="mt-3 inline-flex rounded-full px-2.5 py-0.5 t-badge-sm"
                    style={
                      option.fits_budget
                        ? { background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid var(--color-success-border)" }
                        : { background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid var(--color-danger-border)" }
                    }
                  >
                    {option.fits_budget ? "Within budget" : "Over budget"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={recomputing || isCurrent || noOp}
                  title={noOp ? "Same combination as your current tier" : undefined}
                  onClick={() => onSelectAlternative?.(option)}
                  className="tcc-focus mt-4 w-full rounded-xl py-2 t-btn-sm transition-all"
                  style={
                    isCurrent || noOp
                      ? { background: "#F1F5F9", color: "#5B6B7B", border: "1px solid #E5E7EB", cursor: "default" }
                      : { background: "#FF6B57", color: "#FFFFFF", border: "1px solid transparent" }
                  }
                  onMouseEnter={(e) => { if (!isCurrent && !recomputing) e.currentTarget.style.background = "#F25542"; }}
                  onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "#FF6B57"; }}
                >
                  {isCurrent ? "Current option" : noOp ? "Same combination" : recomputing ? "Updating…" : `Switch to ${MODE_LABELS[option.mode] || "option"}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* What if budget slider — quieter supporting card */}
      <div
        className="card-quiet rounded-[24px] p-6 sm:p-7"
        style={{ color: "#102A43" }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" style={{ color: "#FF6B57" }} />
          <h3 className="font-display t-card-lg" style={{ color: "#102A43" }}>
            What-If Budget Calculator
          </h3>
        </div>
        <p className="mt-1 t-small" style={{ color: "#52606D" }}>
          See which tier unlocks at different budget levels.
        </p>

        <input
          type="range"
          min={1000}
          max={Math.max(100000, maximumOption, Number(plan.budget) * 2)}
          step="1000"
          value={Math.min(whatIfBudget, Math.max(100000, maximumOption, Number(plan.budget) * 2))}
          onChange={(event) => setWhatIfBudget(Number(event.target.value))}
          className="mt-5 w-full"
          style={{ accentColor: "#FF6B57" }}
          aria-label="What-if budget"
        />

        <div className="mt-2 flex justify-between t-meta" style={{ color: "#5B6B7B" }}>
          <span>Test budget</span>
          <strong className="t-price-sm" style={{ color: "#102A43" }}>{inr(whatIfBudget)}</strong>
        </div>

        {bestWhatIf && (
          <div
            className="mt-4 rounded-xl border p-3 t-meta"
            style={
              bestWhatIf.total_cost <= whatIfBudget
                ? { background: "#ECFDF3", borderColor: "#A7F3D0", color: "#102A43" }
                : { background: "#FFFBEB", borderColor: "#FDE68A", color: "#102A43" }
            }
          >
            {bestWhatIf.total_cost <= whatIfBudget ? (
              <>
                <strong style={{ color: "#15803D" }}>{inr(bestWhatIf.total_cost)}</strong> unlocks the {MODE_LABELS[bestWhatIf.mode] || "selected"} tier with {bestWhatIf.flight?.airline}.
              </>
            ) : (
              <>
                The lowest found option is <strong style={{ color: "#FF6B57" }}>{inr(minimumOption)}</strong>; increase your budget to unlock it.
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
