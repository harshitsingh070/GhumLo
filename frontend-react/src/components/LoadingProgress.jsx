import { useEffect, useState } from "react";
import { CalendarDays, Check, Hotel, Map, Plane, X } from "lucide-react";

const PHASES = [
  { label: "Preparing your request", detail: "Checking dates, travelers and budget", Icon: Plane },
  { label: "Searching live options", detail: "Flights and stays can take a minute or more", Icon: Hotel },
  { label: "Building your itinerary", detail: "Grouping nearby places day by day", Icon: Map },
  { label: "Finalizing budget", detail: "Matching combinations to your budget", Icon: CalendarDays },
];

/** Honest long-run loading state: elapsed time, defensible phases,
 *  visible Cancel, no fake rapid cycling. Remounts per search. */
export default function LoadingProgress({ onCancel }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Defensible phase from elapsed, not fake backend progress:
  // 0-15s preparing, 15-60s searching, 60-120s building, 120s+ finalizing.
  const phaseIdx = elapsed < 15 ? 0 : elapsed < 60 ? 1 : elapsed < 120 ? 2 : 3;

  return (
    <section
      className="animate-fade-rise rounded-[24px] bg-white p-6 sm:p-8"
      style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
      role="status"
      aria-live="polite"
      aria-label={`Creating your trip, elapsed ${elapsed} seconds`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[12px]"
            style={{ background: "var(--color-brand-bg)", color: "var(--color-brand)" }}
            aria-hidden="true"
          >
            <Plane className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display t-subsection" style={{ color: "#102A43" }}>
              Creating your trip
            </h2>
            <p className="t-small" style={{ color: "#3E5463" }}>
              Live search can take up to 3 minutes. Elapsed {elapsed}s — you can cancel anytime.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="tcc-focus tcc-touch inline-flex items-center gap-1.5 rounded-xl px-4 t-btn"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#102A43" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        )}
      </div>

      {/* Honest phases */}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {PHASES.map((s, i) => {
          const done = i < phaseIdx;
          const active = i === phaseIdx;
          return (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-[16px] px-3.5 py-3"
              style={{
                border: `1px solid ${active ? "var(--color-brand)" : "#E5E7EB"}`,
                background: active ? "var(--color-brand-bg)" : "#F7F9FC",
              }}
              aria-current={active ? "step" : undefined}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                style={{
                  background: done
                    ? "var(--color-success-bg)"
                    : active
                      ? "var(--color-brand-bg)"
                      : "#EEF2F6",
                  color: done ? "var(--color-success)" : active ? "var(--color-brand)" : "#5B6B7B",
                }}
                aria-hidden="true"
              >
                {done ? <Check className="h-[18px] w-[18px]" /> : <s.Icon className="h-[18px] w-[18px]" />}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 t-body-strong" style={{ color: done || active ? "#102A43" : "#5B6B7B" }}>
                  {done ? "✓ " : active ? "● " : "○ "}{s.label}
                  {done && <span className="sr-only"> (done)</span>}
                  {active && <span className="sr-only"> (in progress)</span>}
                </p>
                <p className="truncate t-meta" style={{ color: "#3E5463" }}>
                  {s.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Indeterminate progress (honest: we don't know exact %) */}
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#EEF2F6" }} aria-hidden="true">
        <div className="tcc-shimmer h-full w-1/3 rounded-full" style={{ background: "var(--color-brand)" }} />
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
