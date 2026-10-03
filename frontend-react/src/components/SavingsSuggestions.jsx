import { CalendarDays, Hotel, Lightbulb, Plane, ArrowRight } from "lucide-react";
import { inr } from "../lib/format.js";

const META = {
  CHEAPER_HOTEL: { icon: Hotel, label: "Cheaper Stay" },
  CHEAPER_FLIGHT: { icon: Plane, label: "Cheaper Flight" },
  SHORTER_TRIP: { icon: CalendarDays, label: "Adjust Nights" },
};

/** Cost Optimization Recommendation Cards — Section 21
 *  Sleek dark glass cards displaying actionable cost-saving tips. */
export default function SavingsSuggestions({ suggestions }) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

  return (
    <section
      id="savings"
      className="glass-panel scroll-mt-24 rounded-[24px] p-6 sm:p-7 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
      aria-label="Ways to reduce the cost"
    >
      <div className="mb-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--coral)" }}>
          Cost Optimizer
        </span>
        <h2 className="font-display text-xl font-extrabold text-white">
          Ways to Reduce Trip Cost
        </h2>
        <p className="mt-1 text-xs text-slate-300">
          Smart recommendations calculated from live options in your results.
        </p>
      </div>

      <div className={`grid gap-3 ${suggestions.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {suggestions.map((s, i) => {
          const meta = META[s.type] ?? { icon: Lightbulb, label: "Saving Opportunity" };
          const Icon = meta.icon;
          return (
            <div
              key={i}
              className="flex flex-col justify-between rounded-[20px] p-5 transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.09)",
              }}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(32, 199, 201, 0.15)", color: "var(--teal)" }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {meta.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-black"
                      style={{ background: "rgba(67, 209, 124, 0.15)", color: "var(--success)" }}
                    >
                      Save {inr(s.potential_savings)}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200">
                    {s.message}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[11px] text-slate-400">Calculated savings</span>
                <a
                  href="#trip-builder"
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--coral)] hover:underline"
                >
                  Adjust plan <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
