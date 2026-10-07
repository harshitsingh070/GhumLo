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

/** Full Destinations page in light style. */
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
    <div className="tcc-page space-y-12 bg-[#F7F9FC] text-[#102A43] sm:space-y-16">
      {/* Page hero */}
      <div className="pt-4">
        <p
          className="t-badge uppercase text-[#FF6B57]"
        >
          Destinations
        </p>
        <h1 className="font-display mt-2 max-w-2xl t-hero text-[#102A43]">
          Places that fit your budget
        </h1>
        <p className="mt-4 max-w-2xl t-body text-[#52606D]">
          Explore curated destinations with realistic pricing. Pick one and we&apos;ll build the
          flights, stay and day-by-day plan around what you can spend.
        </p>
      </div>

      {/* Search status — only when navigated here via navbar search */}
      {query && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white px-4 py-3 t-small text-[#52606D]"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
          role="status"
        >
          <span>
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <strong className="text-[#102A43]">
              “{rawQuery}”
            </strong>
          </span>
          <button
            type="button"
            onClick={clearSearch}
            className="tcc-focus ml-auto t-btn-sm text-[#FF6B57] transition-colors hover:text-[#F25542] hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Detailed cards */}
      {results.length === 0 ? (
        <div
          className="rounded-[24px] bg-white p-8 text-center sm:p-10"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
          role="status"
        >
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#FF6B57]"
            aria-hidden="true"
          >
            <SearchX className="h-6 w-6" />
          </span>
          <h2 className="font-display mt-4 t-subsection text-[#102A43]">
            No destinations match your search
          </h2>
          <p className="mx-auto mt-2 max-w-sm t-body text-[#52606D]">
            Try a different name — Goa, Jaipur, Manali, Mumbai, Delhi or London —
            or browse everything.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="btn-primary mt-5 inline-flex h-[44px] items-center px-6 t-btn"
          >
            Show all destinations
          </button>
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {results.map((p, i) => (
          <Reveal key={p.name} delay={(i % 2) * 80}>
            <article
              className="tcc-zoom h-full overflow-hidden rounded-[24px] bg-white transition-all hover:-translate-y-1"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-[#F1F5F9]">
                <img src={p.img} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
                <span
                  className="absolute right-4 top-4 rounded-full bg-white/95 px-3.5 py-1.5 t-price-sm text-[#102A43]"
                  style={{ border: "1px solid #E5E7EB" }}
                >
                  {p.price}
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <p
                  className="t-badge uppercase text-[#FF6B57]"
                >
                  {p.tag}
                </p>
                <h2 className="font-display mt-1 t-section text-[#102A43]">
                  {p.name}
                </h2>
                <p className="mt-2 t-body text-[#52606D]">
                  {p.blurb}
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 t-meta text-[#829AB1]">
                  <CalendarDays className="h-4 w-4 text-[#3B82F6]" aria-hidden="true" />
                  {p.season}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF2F6] pt-5">
                  <button
                    type="button"
                    onClick={() => onPick?.(p.name)}
                    className="btn-primary inline-flex h-[44px] items-center gap-2 rounded-xl px-5 t-btn"
                  >
                    Plan this trip
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <span className="font-display t-price-sm text-[#102A43]">
                    from {p.price}
                  </span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      )}

      <CtaSection onPlan={() => go("trip")} />
    </div>
  );
}
