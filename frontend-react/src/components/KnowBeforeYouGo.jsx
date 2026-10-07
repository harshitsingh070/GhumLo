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
      className="scroll-mt-24 rounded-[16px] p-5"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        color: "#102A43",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "#EFF6FF", color: "#3B82F6", border: "1px solid #DBEAFE" }}
          >
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display t-activity" style={{ color: "#102A43" }}>
              Good to Know - {destination || "Destination"}
            </h2>
            <p className="mt-0.5 t-meta-sm" style={{ color: "#52606D" }}>
              Entry regulations, safety guidelines & local pointers.
            </p>
          </div>
        </div>

        {know.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex shrink-0 items-center gap-1 pt-0.5 t-btn-sm hover:underline"
            style={{ color: "#FF6B57" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F25542"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>View all ({know.length}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {visibleItems.map((k, i) => (
          <li
            key={i}
            className="rounded-xl px-3 py-2.5"
            style={{ background: "#F7F9FC", border: "1px solid #EEF2F6" }}
          >
            <a
              href={k.link}
              target="_blank"
              rel="noopener noreferrer"
              className="tcc-focus block truncate t-label"
              style={{ color: "#102A43" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#102A43"; }}
              title={k.title}
            >
              {k.title}
            </a>
            {k.snippet && (
              <p className="mt-0.5 truncate t-meta-sm" style={{ color: "#52606D" }} title={k.snippet}>
                {k.snippet}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
