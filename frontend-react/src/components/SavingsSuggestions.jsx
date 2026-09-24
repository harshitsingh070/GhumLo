import { CalendarDays, Hotel, Lightbulb, Plane } from "lucide-react";
import { inr } from "../lib/format.js";

/** Type -> icon/tint for the real backend suggestion kinds. ONLY these
 *  three exist server-side (CHEAPER_HOTEL, CHEAPER_FLIGHT, SHORTER_TRIP) —
 *  never render any other type; unknown types fall back to a bulb. */
const META = {
  CHEAPER_HOTEL: { icon: Hotel, label: "Cheaper hotel" },
  CHEAPER_FLIGHT: { icon: Plane, label: "Cheaper flight" },
  SHORTER_TRIP: { icon: CalendarDays, label: "Shorter trip" },
};

/** "Ways to reduce the cost" — cards in a grid, icon + ₹ figure
 *  prominent. Renders NOTHING (null, no DOM) when suggestions is
 *  undefined, null, or empty. Over-budget only; App never passes it a
 *  fitting plan's data. */
export default function SavingsSuggestions({ suggestions }) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;
  return (
    <section
      className="rounded-[18px] border border-clay/25 bg-clay/5 p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-white/5"
      aria-label="Ways to reduce the cost"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
        Ways to reduce the cost
      </h2>
      <p className="mb-4 mt-1 text-sm text-smoke dark:text-white/60">
        Calculated from live prices in your results — no guesswork.
      </p>
      <div className={`grid gap-3 ${suggestions.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {suggestions.map((s, i) => {
          const meta = META[s.type] ?? { icon: Lightbulb, label: "Saving" };
          const Icon = meta.icon;
          return (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-line bg-white p-5 dark:border-white/10 dark:bg-ink"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-clay">
                  {meta.label}
                </p>
                <p className="mb-1.5 mt-1 text-[15px] leading-relaxed text-ink/80 dark:text-white/75">
                  {s.message}
                </p>
                <p className="font-display text-lg font-extrabold text-pine">
                  Saves {inr(s.potential_savings)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
