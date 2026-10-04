import { CalendarDays, Users, Wallet } from "lucide-react";
import heroGoa from "../assets/destinations/hero-goa.jpg";
import { DESTINATIONS } from "../lib/destinations.js";
import TripPreviewCard from "./TripPreviewCard.jsx";

/** Resolve a bundled cinematic photo for the current destination —
 *  same dynamic-location image feature as the Explore hero. */
function heroImageFor(destination) {
  if (!destination) return heroGoa;
  const name = String(destination).toLowerCase();
  const match = DESTINATIONS.find((d) => name.includes(d.name.toLowerCase()));
  return match ? match.img : heroGoa;
}

/** Full-screen trip hero — same look as the Explore hero: edge-to-edge
 *  destination photo, gradient overlays, left copy, live trip card floating
 *  above the image on the right (stacked below copy on mobile). */
export default function TripHero({ plan, onViewPlan }) {
  const destination = plan?.destination || "Goa";
  const img = heroImageFor(plan?.destination);
  const known = DESTINATIONS.find((d) =>
    String(destination).toLowerCase().includes(d.name.toLowerCase())
  );
  const total = Number(plan?.best_pick?.total_cost) || 0;

  const pills = plan
    ? [
        {
          icon: CalendarDays,
          title: `${plan.departure_date} → ${plan.return_date}`,
          sub: "Trip dates",
        },
        {
          icon: Users,
          title: `${plan.travelers} traveler${Number(plan.travelers) === 1 ? "" : "s"}`,
          sub: "Group",
        },
        {
          icon: Wallet,
          title: total > 0 ? `₹${Number(total).toLocaleString("en-IN")}` : "—",
          sub: "Total",
        },
      ]
    : [];

  return (
    <section
      id="trip-hero"
      className="relative overflow-hidden scroll-mt-[92px]"
      style={{ minHeight: "640px" }}
    >
      {/* Background image */}
      <img
        src={img}
        alt={known ? known.alt : "Goa beach with palm trees"}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        style={{ objectPosition: "center 42%", filter: "brightness(1.16) saturate(1.12)" }}
      />

      {/* Gradient overlay — darkest on the left so copy stays legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(4,20,27,0.90) 0%, rgba(4,20,27,0.60) 44%, rgba(4,20,27,0.16) 100%)," +
            "linear-gradient(to top, rgba(6,27,36,0.94) 0%, rgba(6,27,36,0.30) 22%, transparent 55%)",
        }}
        aria-hidden="true"
      />

      {/* Destination script wordmark — idle state only.
          Once a plan exists the live trip card owns the right-hand corner. */}
      {!plan && (
      <div
        className="pointer-events-none absolute right-8 top-[150px] hidden text-right lg:block"
        aria-hidden="true"
      >
        <p
          className="font-display text-[54px] font-extrabold italic leading-none tracking-tight"
          style={{
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          {destination}
        </p>
        <p className="mt-1 text-[15px] font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.62)" }}>
          {known ? known.tag : "India"}
        </p>
      </div>
      )}

      {/* Content */}
      <div className="tcc-container relative z-10 flex min-h-[640px] items-center pb-44 pt-[112px]">
        <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="max-w-[720px] animate-fade-rise">
            {/* Eyebrow */}
            <p
              className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{
                background: "rgba(4,20,27,0.5)",
                border: "1px solid rgba(255,255,255,0.24)",
                color: "var(--text-primary)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--coral)" }} aria-hidden="true" />
              Plan trip{known ? ` · ${known.tag}` : ""}
            </p>

            {/* Headline */}
            <h1
              className="font-display font-extrabold leading-[1.0] tracking-[-0.035em]"
              style={{ fontSize: "clamp(44px, 5.2vw, 76px)", color: "var(--text-primary)" }}
            >
              {destination ? (
                <>
                  Your {destination}
                  <br />
                  trip <span style={{ color: "var(--coral)" }}>plan.</span>
                </>
              ) : (
                <>
                  Your trip
                  <br />
                  <span style={{ color: "var(--coral)" }}>plan.</span>
                </>
              )}
            </h1>

            {/* Sub */}
            <p
              className="mt-6 max-w-xl text-[17px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              {plan
                ? "Flights, stay and day-by-day details — all below on this page."
                : "Build your route on the Explore page — the full plan appears here."}
            </p>

            {/* Trip pills */}
            {pills.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2.5">
                {pills.map(({ icon: Icon, title, sub }) => (
                  <div
                    key={sub}
                    className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                      style={{ background: "rgba(255,114,94,0.20)", color: "var(--coral)" }}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Mobile trip summary — same live data as the desktop floating card.
                TripPreviewCard returns null until a plan exists, so this adds
                zero layout shift when idle. */}
            {plan?.best_pick && (
              <div className="mt-6 lg:hidden">
                <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
              </div>
            )}
          </div>

          {/* Live trip card — floats above the photo once a plan exists (desktop). */}
          <div className="hidden justify-end pt-6 lg:flex">
            <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
          </div>
        </div>
      </div>

      {/* Soft fade into the page background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to top, var(--bg-primary), transparent)" }}
        aria-hidden="true"
      />
    </section>
  );
}
