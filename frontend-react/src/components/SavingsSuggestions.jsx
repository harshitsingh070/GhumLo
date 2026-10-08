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
      className="scroll-mt-24 rounded-[24px] p-6 sm:p-7"
      style={{
        background: "#ECFDF3",
        border: "1px solid #A7F3D0",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        color: "#102A43",
      }}
      aria-label="Ways to reduce the cost"
    >
      <div className="mb-4">
        <span className="t-badge uppercase" style={{ color: "#15803D" }}>
          Cost Optimizer
        </span>
        <h2 className="font-display t-section" style={{ color: "#102A43" }}>
          Ways to Reduce Trip Cost
        </h2>
        <p className="mt-1 t-small" style={{ color: "#52606D" }}>
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
              className="flex flex-col justify-between rounded-[20px] bg-white p-5 transition-all hover:-translate-y-1"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: "#ECFDF3", color: "#15803D", border: "1px solid #A7F3D0" }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-badge uppercase" style={{ color: "#5B6B7B" }}>
                      {meta.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 t-badge"
                      style={{ background: "#ECFDF3", color: "#15803D", border: "1px solid #A7F3D0" }}
                    >
                      Save {inr(s.potential_savings)}
                    </span>
                  </div>
                  <p className="mt-2 t-body" style={{ color: "#102A43" }}>
                    {s.message}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "#EEF2F6" }}>
                <span className="t-meta-sm" style={{ color: "#5B6B7B" }}>Calculated savings</span>
                <a
                  href="#trip-builder"
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 t-btn-sm transition-colors"
                  style={{ background: "#FF6B57", color: "#FFFFFF" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F25542"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FF6B57"; }}
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
