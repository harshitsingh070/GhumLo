import { BookOpenCheck, ChevronDown, ChevronUp } from "lucide-react";
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
      className="glass-panel scroll-mt-24 rounded-[16px] p-5 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "rgba(96, 165, 250, 0.15)", color: "#60A5FA" }}
          >
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-white">
              Good to Know - {destination || "Destination"}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Entry regulations, safety guidelines & local pointers.
            </p>
          </div>
        </div>

        {know.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex shrink-0 items-center gap-1 pt-0.5 text-[11px] font-semibold text-[var(--coral)] hover:underline"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>View all ({know.length}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-white/[0.07]">
        {visibleItems.map((k, i) => (
          <li key={i} className="py-2.5 first:pt-1 last:pb-0">
            <a
              href={k.link}
              target="_blank"
              rel="noopener noreferrer"
              className="tcc-focus block truncate text-[12.5px] font-semibold text-white hover:text-[var(--coral)]"
              title={k.title}
            >
              {k.title}
            </a>
            {k.snippet && (
              <p className="mt-0.5 truncate text-[11.5px] leading-relaxed text-slate-400" title={k.snippet}>
                {k.snippet}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
