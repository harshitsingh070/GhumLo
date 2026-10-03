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
      className="glass-panel animate-fade-rise rounded-[24px] p-6 sm:p-8"
      aria-live="polite"
      aria-label="Finding the best options for your budget"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ background: "var(--coral-soft)", color: "var(--coral)" }}
          aria-hidden="true"
        >
          <Plane className="h-5 w-5" />
        </span>
        <div>
          <h2
            className="font-display text-xl font-extrabold tracking-tight sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            Finding the best options for your budget…
          </h2>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
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
              className="glass-tile flex items-center gap-3 px-3.5 py-3"
              style={{
                background: active ? "rgba(255,114,94,0.08)" : undefined,
                borderColor: active ? "rgba(255,114,94,0.30)" : undefined,
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                style={{
                  background: done
                    ? "rgba(32,199,201,0.16)"
                    : active
                      ? "var(--coral-soft)"
                      : "rgba(255,255,255,0.06)",
                  color: done ? "var(--teal)" : active ? "var(--coral)" : "var(--text-muted)",
                }}
                aria-hidden="true"
              >
                {done ? <Check className="h-[18px] w-[18px]" /> : <s.Icon className="h-[18px] w-[18px]" />}
              </span>
              <div className="min-w-0">
                <p
                  className="flex items-center gap-2 text-[14px] font-semibold"
                  style={{ color: done || active ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {s.label}
                  {done && <span className="sr-only"> (done)</span>}
                  {active && (
                    <span
                      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                      style={{ background: "var(--coral)" }}
                      aria-hidden="true"
                    />
                  )}
                </p>
                <p className="truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
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
              background: i <= step ? "var(--coral)" : "rgba(255,255,255,0.10)",
            }}
          />
        ))}
      </div>

      {/* Skeleton preview cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-hidden="true">
        <div className="tcc-skeleton h-28 rounded-[18px]" />
        <div className="tcc-skeleton h-28 rounded-[18px]" />
        <div className="tcc-skeleton h-28 rounded-[18px]" />
      </div>
    </section>
  );
}
