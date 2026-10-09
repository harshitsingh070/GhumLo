/** About section: hackathon story, SerpApi engine credits, engineering highlights. */
import { Database, Globe2, Layers, Plane, Zap } from "lucide-react";
import { DESTINATIONS } from "../lib/destinations.js";

const ENGINES = [
  "google_flights",
  "google_hotels",
  "google_maps × 2",
  "google_events",
  "google_finance",
  "youtube",
  "google (weather)",
  "google (know)",
];

const HIGHLIGHTS = [
  { icon: Zap, color: "#FF6B57", bg: "#FFF1EE", label: "4 core SerpApi searches per full plan" },
  { icon: Database, color: "#3B82F6", bg: "#EFF6FF", label: "7,884-airport offline dataset" },
  { icon: Globe2, color: "#8B5CF6", bg: "#F5F3FF", label: "10 SerpApi engines integrated" },
  { icon: Layers, color: "#22C55E", bg: "#ECFDF3", label: "23 automated backend tests" },
];

export default function About() {
  const img = DESTINATIONS?.[0]?.img;
  return (
    <section
      id="about"
      aria-label="About GhoomLo"
      className="scroll-mt-24 space-y-6"
    >
      {/* Main blurb */}
      <div
        className="rounded-[20px] bg-white p-7 text-[#102A43] sm:p-9"
        style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="t-badge uppercase text-[#FF6B57]">About GhoomLo</p>
            <h2 className="font-display mt-2 t-section text-[#102A43]">
              Built Around Your Budget
            </h2>
            <p className="mt-3 max-w-3xl t-body text-[#52606D]">
              GhoomLo is a budget-first travel planner built for the{" "}
              <strong className="text-[#102A43]">SerpApi India Hackathon 2026</strong>{" "}
              (Travel &amp; Local Discovery track). Enter a route and budget — GhoomLo fetches live
              flights, hotels, and nearby places via SerpApi, finds the cheapest combination that
              fits your wallet, and builds a geographically clustered day-by-day itinerary around
              your stay, enriched with live weather, events, exchange rates, packing tips, and
              destination vlogs.
            </p>
            <p className="mt-2 t-body text-[#52606D]">
              Core pipeline uses <strong className="text-[#102A43]">exactly 4 SerpApi searches</strong>{" "}
              per plan (1 flights + 1 hotels + 2 maps). Up to 5 optional enrichments run in parallel
              with fast fail-safe timeouts — never stalling the core trip on failure.
            </p>
          </div>
          {img && (
            <img
              src={img}
              alt="Goa destination photo"
              loading="lazy"
              className="h-36 w-full rounded-2xl object-cover md:w-60"
              style={{ border: "1px solid #E5E7EB" }}
            />
          )}
        </div>

        {/* Engineering highlights */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, color, bg, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-[14px] p-3"
              style={{ background: bg, border: `1px solid ${color}22` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: "#fff", color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="t-meta font-medium text-[#102A43]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SerpApi engines used */}
      <div
        className="rounded-[20px] bg-white p-6 sm:p-7"
        style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="t-badge uppercase text-[#FF6B57]">SerpApi Engines Used</p>
            <h3 className="font-display mt-1 t-subsection text-[#102A43]">
              10 Engines, One Coherent Product
            </h3>
            <p className="mt-1 t-small text-[#52606D]">
              Each engine is chosen specifically for its data type — not interchangeable.
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-4 py-1.5 t-badge font-semibold"
            style={{ background: "#FFF1EE", border: "1px solid #FFD9D1", color: "#FF6B57" }}
          >
            Powered by SerpApi
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {ENGINES.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 t-meta font-mono"
              style={{
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                color: "#334155",
              }}
            >
              <Plane className="h-3 w-3 text-[#FF6B57]" aria-hidden="true" />
              {e}
            </span>
          ))}
          <span
            className="inline-flex items-center rounded-full px-3 py-1 t-meta font-mono"
            style={{ background: "#ECFDF3", border: "1px solid #A7F3D0", color: "#15803D" }}
          >
            + reviews (lazy, on-expand)
          </span>
        </div>
      </div>
    </section>
  );
}
