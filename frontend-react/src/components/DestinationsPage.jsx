import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, SearchX } from "lucide-react";
import CtaSection from "./CtaSection.jsx";
import Reveal from "./Reveal.jsx";
import { DESTINATIONS } from "../lib/destinations.js";
import { go } from "../lib/router.js";

/** Read the navbar search query from the hash ("#/destinations?q=goa").
 *  The navbar writes it; this page was ignoring it, so searching appeared
 *  to do nothing. Tracks hash changes so repeat searches update live. */
function useSearchQuery() {
  const read = () => {
    const h = typeof window !== "undefined" ? window.location.hash || "" : "";
    const qi = h.indexOf("?");
    if (qi < 0) return "";
    try {
      return new URLSearchParams(h.slice(qi + 1)).get("q") || "";
    } catch {
      return "";
    }
  };
  const [q, setQ] = useState(read);
  useEffect(() => {
    const onChange = () => setQ(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return q;
}

/** Full Destinations page in dark glassmorphic style. */
export default function DestinationsPage({ onPick }) {
  const rawQuery = useSearchQuery().trim();
  const query = rawQuery.toLowerCase();
  const results = query
    ? DESTINATIONS.filter((p) =>
        [p.name, p.tag, p.blurb, p.season]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(query))
      )
    : DESTINATIONS;
  const clearSearch = () => {
    window.location.hash = "#/destinations";
  };

  return (
    <div className="tcc-page space-y-12 sm:space-y-16 text-white">
      {/* Page hero */}
      <div className="pt-4">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--coral)" }}
        >
          Destinations
        </p>
        <h1 className="font-display mt-2 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl">
          Places that fit your budget
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Explore curated destinations with realistic pricing. Pick one and we&apos;ll build the
          flights, stay and day-by-day plan around what you can spend.
        </p>
      </div>

      {/* Search status — only when navigated here via navbar search */}
      {query && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-[16px] px-4 py-3 text-[13px]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "var(--text-secondary)",
          }}
          role="status"
        >
          <span>
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              “{rawQuery}”
            </strong>
          </span>
          <button
            type="button"
            onClick={clearSearch}
            className="tcc-focus ml-auto text-[12px] font-bold transition-colors hover:underline"
            style={{ color: "var(--coral)" }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Detailed cards */}
      {results.length === 0 ? (
        <div
          className="glass-panel rounded-[24px] p-8 text-center sm:p-10"
          role="status"
        >
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,114,94,0.15)", color: "var(--coral)" }}
            aria-hidden="true"
          >
            <SearchX className="h-6 w-6" />
          </span>
          <h2 className="font-display mt-4 text-xl font-extrabold text-white">
            No destinations match your search
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] text-slate-300">
            Try a different name — Goa, Jaipur, Manali, Mumbai, Delhi or London —
            or browse everything.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="btn-primary mt-5 inline-flex h-[44px] items-center px-6 text-[13px] font-bold"
          >
            Show all destinations
          </button>
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {results.map((p, i) => (
          <Reveal key={p.name} delay={(i % 2) * 80}>
            <article
              className="tcc-zoom h-full overflow-hidden rounded-[24px] transition-all hover:-translate-y-1"
              style={{
                background: "rgba(9, 38, 48, 0.88)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={p.img} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, rgba(6,27,36,0.8) 0%, transparent 60%)",
                  }}
                />
                <span
                  className="absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md"
                  style={{ background: "rgba(0,0,0,0.65)" }}
                >
                  {p.price}
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: "var(--coral)" }}
                >
                  {p.tag}
                </p>
                <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-white">
                  {p.name}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-300">
                  {p.blurb}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <CalendarDays className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" />
                  {p.season}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => onPick?.(p.name)}
                    className="btn-primary inline-flex h-[44px] items-center gap-2 rounded-xl px-5 text-[13px] font-bold"
                  >
                    Plan this trip
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <span className="font-display text-base font-extrabold text-white">
                    from {p.price}
                  </span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      )}

      <CtaSection onPlan={() => go("home", "plan")} />
    </div>
  );
}
