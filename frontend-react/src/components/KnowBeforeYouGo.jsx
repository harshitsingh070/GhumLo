import { BookOpenCheck, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

/** KnowBeforeYouGo — Section 23
 *  Compact expandable cards for entry, safety, visa, currency, and local pointers. */
export default function KnowBeforeYouGo({ know, destination }) {
  const [expanded, setExpanded] = useState(false);
  if (!Array.isArray(know) || know.length === 0) return null;

  const visibleItems = expanded ? know : know.slice(0, 3);

  return (
    <section
      id="know"
      aria-label="Know before you go"
      className="glass-panel scroll-mt-24 rounded-[24px] p-6 sm:p-7 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(183, 148, 244, 0.15)", color: "#B794F4" }}
          >
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              Good to Know · {destination || "Destination"}
            </h2>
            <p className="text-xs text-slate-300">
              Entry regulations, safety guidelines & local pointers.
            </p>
          </div>
        </div>

        {know.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--coral)] hover:underline"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>View all ({know.length}) <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((k, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-[16px] p-4 transition-all hover:bg-white/5"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <a
                href={k.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tcc-focus inline-flex items-start gap-1 text-[13px] font-bold text-white hover:text-[var(--coral)]"
              >
                <span className="line-clamp-2">{k.title}</span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
              </a>
              {k.snippet && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-300">
                  {k.snippet}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
