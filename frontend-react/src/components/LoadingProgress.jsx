import { useEffect, useState } from "react";
import { CalendarDays, Check, Hotel, Map, Plane } from "lucide-react";

const STEPS = [
  { label: "Flights", detail: "Comparing live fares for your dates", Icon: Plane },
  { label: "Hotels", detail: "Checking stays near your destination", Icon: Hotel },
  { label: "Nearby places", detail: "Finding attractions and food spots", Icon: Map },
  { label: "Itinerary", detail: "Assembling your day-by-day plan", Icon: CalendarDays },
];

/** Search loading state: dark glass checklist + skeleton preview cards.
 *  Remounts on every search, so the step cycle always restarts with it. */
export default function LoadingProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      className="animate-fade-rise rounded-[24px] bg-white p-6 sm:p-8"
      style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
      aria-live="polite"
      aria-label="Finding the best options for your budget"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FFF1EE] text-[#FF6B57]"
          aria-hidden="true"
        >
          <Plane className="h-5 w-5" />
        </span>
        <div>
          <h2
            className="font-display t-subsection text-[#102A43]"
          >
            Finding the best options for your budget…
          </h2>
          <p className="t-small text-[#52606D]">
            Real flights, stays and places — no sample data.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-[16px] bg-[#F7F9FC] px-3.5 py-3"
              style={{
                border: `1px solid ${active ? "#FF6B57" : "#E5E7EB"}`,
                background: active ? "#FFF1EE" : "#F7F9FC",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                style={{
                  background: done
                    ? "#ECFDF3"
                    : active
                      ? "#FFF1EE"
                      : "#EEF2F6",
                  color: done ? "#22C55E" : active ? "#FF6B57" : "#829AB1",
                }}
                aria-hidden="true"
              >
                {done ? <Check className="h-[18px] w-[18px]" /> : <s.Icon className="h-[18px] w-[18px]" />}
              </span>
              <div className="min-w-0">
                <p
                  className={`flex items-center gap-2 t-body-strong ${done || active ? "text-[#102A43]" : "text-[#829AB1]"}`}
                >
                  {s.label}
                  {done && <span className="sr-only"> (done)</span>}
                  {active && (
                    <span
                      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6B57]"
                      aria-hidden="true"
                    />
                  )}
                </p>
                <p className="truncate t-meta text-[#52606D]">
                  {s.detail}
                </p>
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
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i <= step ? "#FF6B57" : "#EEF2F6",
            }}
          />
        ))}
      </div>

      {/* Skeleton preview cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-hidden="true">
        <div className="tcc-skeleton h-28 rounded-[18px] bg-[#EEF2F6]" />
        <div className="tcc-skeleton h-28 rounded-[18px] bg-[#EEF2F6]" />
        <div className="tcc-skeleton h-28 rounded-[18px] bg-[#EEF2F6]" />
      </div>
    </section>
  );
}
