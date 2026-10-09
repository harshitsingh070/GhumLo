import { useEffect, useState } from "react";
import { Sparkles, Plane, Wallet, MapPin } from "lucide-react";
import { DESTINATIONS, photoPoolFor, heroImageFor } from "../lib/destinations.js";
import { HeroEyebrow, HeroVeil, HeroShell } from "./HeroShared.jsx";
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
  const photos = photoPoolFor(destination);
  const liveHero = heroImageFor(destination, plan);
  const hasLive = Boolean(plan && liveHero.isLive);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
    if (plan || photos.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setPhotoIndex((index) => (index + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [destination, plan]);

  const known = DESTINATIONS.find((d) =>
    String(destination).toLowerCase().includes(d.name.toLowerCase())
  );

  return (
    <HeroShell id="home">
      {/* After search: exact live photo from this search (static).
          Before search: rotating bundled photos. */}
      {hasLive ? (
        <img
          src={liveHero.src}
          alt={liveHero.name ? `${liveHero.name}, ${destination}` : `${destination} — live photo from your search`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { if (liveHero.fallback && e.currentTarget.src !== liveHero.fallback) e.currentTarget.src = liveHero.fallback; }}
          style={{
            objectPosition: "center 38%",
            filter: "contrast(1.06) saturate(1.08)",
          }}
        />
      ) : (
        photos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? (known ? known.alt : `${destination} destination`) : ""}
            aria-hidden={i !== photoIndex}
            className="absolute inset-0 h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            style={{
              objectPosition: "center 38%",
              filter: "contrast(1.06) saturate(1.08)",
              opacity: i === photoIndex ? 1 : 0,
              transition: "opacity 1.2s ease-in-out",
            }}
          />
        ))
      )}

      <HeroVeil />

      {/* Content — flows naturally on mobile, overlaps cleanly on desktop */}
      <div className="tcc-container relative z-10 flex min-h-[clamp(440px,65vh,700px)] items-start pb-24 pt-[118px] sm:pb-56">
        <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-[720px] animate-fade-rise">
            <HeroEyebrow>Smart travel planning</HeroEyebrow>

            {/* Headline */}
            <h1
              className="t-hero font-display"
              style={{ color: "#0B2237" }}
            >
              Plan unforgettable
              <br />
              trips with{" "}
              <span style={{ color: "#F25542" }}>GhoomLo.</span>
            </h1>

            {/* Sub — supporting line, lighter weight + smaller than headline */}
            <p
              className="t-body mt-5 max-w-xl"
              style={{ color: "#22384E" }}
            >
              Find flights, stays and experiences that fit your budget.
              Compare real options and get a complete trip plan in one place.
            </p>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {FEATURES.map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="flex shrink-0 items-center gap-2.5 rounded-[14px] px-3 py-2.5"
                  style={{
                    background: "#FFFFFF",
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
    </HeroShell>
  );
}
