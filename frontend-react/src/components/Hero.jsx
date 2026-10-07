import { Sparkles, Plane, Wallet, MapPin } from "lucide-react";
import { DESTINATIONS, bundledHeroFor } from "../lib/destinations.js";
import TripPreviewCard from "./TripPreviewCard.jsx";

const FEATURES = [
  { icon: Plane, title: "Real-time prices", sub: "Flights, hotels & more" },
  { icon: Wallet, title: "Budget friendly", sub: "Trips within your budget" },
  { icon: Sparkles, title: "AI powered", sub: "Smart itineraries instantly" },
];

/** GhoomLo Explore hero — full-bleed destination photo as the section
 *  background with a light readability wash, navy headline on the left
 *  and the live trip preview floating on the right.
 *  The trip builder overlaps this section from below. */
export default function Hero({ plan, onViewPlan }) {
  const destination = plan?.destination || "Goa";
  // Bundled location photo only (full-resolution assets): catalogue match
  // → stable hash-picked photo per location. No live thumbnails here —
  // small provider images pixelate when stretched full-bleed.
  const img = bundledHeroFor(plan?.destination || "Goa");
  const known = DESTINATIONS.find((d) =>
    String(destination).toLowerCase().includes(d.name.toLowerCase())
  );

  return (
    <section
      id="home"
      className="relative scroll-mt-[92px] overflow-hidden"
      style={{ minHeight: "700px" }}
    >
      {/* Full-background destination image */}
      <img
        src={img}
        alt={known ? known.alt : `${destination} destination`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        style={{ objectPosition: "center 38%" }}
      />

      {/* Light readability wash — sheer veil over the whole photo so it
          shows through edge-to-edge (left included), denser on the left
          where the copy sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(247,249,252,0.84) 0%, rgba(247,249,252,0.68) 35%, rgba(247,249,252,0.32) 62%, rgba(247,249,252,0.08) 85%, rgba(247,249,252,0.02) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content — top-aligned so pills/chip sit under the headline,
          clear of the overlapping builder form below */}
      <div className="tcc-container relative z-10 flex min-h-[700px] items-start pb-56 pt-[118px]" style={{ maxWidth: 1320 }}>
        <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-[720px] animate-fade-rise">
            {/* Eyebrow — kicker label */}
            <p
              className="t-badge mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 uppercase"
              style={{
                background: "#FFF1EE",
                border: "1px solid #FFD9D1",
                color: "#F25542",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#FF6B57" }} aria-hidden="true" />
              Smart travel planning
            </p>

            {/* Headline */}
            <h1
              className="t-hero font-display"
              style={{
                color: "#0B2237",
                textShadow: "0 0 28px rgba(247,249,252,0.95), 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              Plan unforgettable
              <br />
              trips with{" "}
              <span style={{ color: "#F25542" }}>GhoomLo.</span>
            </h1>

            {/* Sub — supporting line, lighter weight + smaller than headline */}
            <p
              className="t-body mt-5 max-w-xl"
              style={{ color: "#3E5463", textShadow: "0 1px 12px rgba(247,249,252,0.9)" }}
            >
              Find flights, stays and experiences that fit your budget.
              Compare real options and get a complete trip plan in one place.
            </p>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {FEATURES.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="flex shrink-0 items-center gap-2.5 rounded-[14px] px-3 py-2.5 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.94)",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: "#FFF1EE", color: "#FF6B57" }}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="whitespace-nowrap">
                    <p className="t-meta whitespace-nowrap" style={{ color: "#0B2237", fontWeight: 600 }}>{title}</p>
                    <p className="t-meta-sm whitespace-nowrap" style={{ color: "#677F93" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Destination chip — in-flow below pills so it can never
                overlap them */}
            <div className="mt-4">
              <span
                className="t-meta inline-flex items-center gap-1.5 rounded-full px-4 py-2"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid #E5E7EB",
                  color: "#0B2237",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
                }}
              >
                <span style={{ color: "#FF6B57" }}>📍</span> {destination}{known ? ` · ${known.tag}` : ""}
              </span>
            </div>
            {plan?.best_pick && (
              <div className="mt-6 lg:hidden">
                <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
              </div>
            )}
          </div>

          {/* Live trip preview (desktop). */}
          <div className="hidden justify-end pt-2 lg:flex">
            <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
          </div>
        </div>
      </div>

      {/* Fade into the page background so the builder overlaps cleanly */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28"
        style={{ background: "linear-gradient(to top, #F7F9FC 0%, rgba(247,249,252,0) 100%)" }}
        aria-hidden="true"
      />

      <span className="sr-only">
        <MapPin aria-hidden="true" /> Popular destinations: Goa, Jaipur, Manali, Mumbai, Delhi, London
      </span>
    </section>
  );
}
