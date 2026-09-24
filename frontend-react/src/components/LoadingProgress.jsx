import { useEffect, useState } from "react";
import { CalendarDays, Check, Hotel, Map, Plane } from "lucide-react";

const STEPS = [
  { label: "Flights", detail: "Comparing live fares for your dates", Icon: Plane },
  { label: "Hotels", detail: "Checking stays near your destination", Icon: Hotel },
  { label: "Nearby places", detail: "Finding attractions and food spots", Icon: Map },
  { label: "Itinerary", detail: "Assembling your day-by-day plan", Icon: CalendarDays },
];

/** Clean search loading state: progress checklist + skeleton cards.
 *  Cycles through steps while mounted; no spinners-as-content. */
export default function LoadingProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="animate-fade-rise rounded-[20px] border border-line bg-white p-6 shadow-card sm:p-8 dark:border-white/10 dark:bg-ink"
      aria-live="polite"
      aria-label="Finding the best options for your budget"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl dark:text-white">
        Finding the best options for your budget…
      </h2>

      {/* Checklist */}
      <ol className="mt-5 space-y-3">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  done
                    ? "bg-pine text-white"
                    : active
                      ? "bg-clay text-white"
                      : "bg-sand text-smoke dark:bg-white/10 dark:text-white/50"
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="h-5 w-5" /> : <s.Icon className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-[15px] font-semibold ${
                    done || active ? "text-ink dark:text-white" : "text-smoke dark:text-white/50"
                  }`}
                >
                  {s.label}
                  {done && <span className="sr-only"> (done)</span>}
                  {active && (
                    <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-clay" aria-hidden="true" />
                  )}
                </p>
                <p className="text-sm text-smoke dark:text-white/55">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Progress bar */}
      <div className="mt-6 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-clay" : "bg-sand dark:bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Skeleton preview cards */}
      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="tcc-skeleton h-24 rounded-2xl" />
        <div className="tcc-skeleton h-14 rounded-2xl" />
        <div className="tcc-skeleton h-32 rounded-2xl" />
      </div>
    </section>
  );
}
