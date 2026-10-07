import { CalendarDays, Users, Wallet, Plane, BedDouble, ArrowRight } from "lucide-react";
import { DESTINATIONS, bundledHeroFor } from "../lib/destinations.js";
import TripPreviewCard from "./TripPreviewCard.jsx";

/** Light trip hero — destination image card + navy heading, trip facts,
 *  flight/hotel breakdown and primary CTA. Communicates where / when /
 *  how many / cost / action at a glance. */
export default function TripHero({ plan, onViewPlan }) {
  const destination = plan?.destination || "Goa";
  // Bundled location photo only (full-resolution assets): catalogue match
  // → stable hash-picked photo per location. No live thumbnails here —
  // small provider images pixelate when stretched full-bleed.
  const img = bundledHeroFor(plan?.destination || "Goa");
  const known = DESTINATIONS.find((d) =>
    String(destination).toLowerCase().includes(d.name.toLowerCase())
  );
  const total = Number(plan?.best_pick?.total_cost) || 0;
  const flight = plan?.best_pick?.flight || {};
  const hotel = plan?.best_pick?.hotel || {};

  const pills = plan
    ? [
        {
          icon: CalendarDays,
          title: `${plan.departure_date} → ${plan.return_date}`,
          sub: "Trip dates",
          bg: "#EFF6FF",
          fg: "#3B82F6",
        },
        {
          icon: Users,
          title: `${plan.travelers} traveler${Number(plan.travelers) === 1 ? "" : "s"}`,
          sub: "Group",
          bg: "#F5F3FF",
          fg: "#8B5CF6",
        },
        {
          icon: Wallet,
          title: total > 0 ? `₹${Number(total).toLocaleString("en-IN")}` : "—",
          sub: "Total estimated cost",
          bg: "#ECFDF3",
          fg: "#22C55E",
        },
      ]
    : [];

  return (
    <section
      id="trip-hero"
      className="relative scroll-mt-[92px] overflow-hidden"
      style={{ minHeight: "640px" }}
    >
      {/* Full-background destination image */}
      <img
        src={img}
        alt={known ? known.alt : `${destination} destination`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        style={{ objectPosition: "center 38%" }}
      />

      {/* Soft readability veil — gentle blur-like wash on the left where
          the copy sits, opening to the crisp photo on the right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(247,249,252,0.84) 0%, rgba(247,249,252,0.68) 35%, rgba(247,249,252,0.32) 62%, rgba(247,249,252,0.08) 85%, rgba(247,249,252,0.02) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content — top-aligned so pills/cards stack under the headline,
          clear of the overlapping dashboard below */}
      <div className="tcc-container relative z-10 flex min-h-[640px] items-start pb-44 pt-[118px]" style={{ maxWidth: 1320 }}>
        <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: heading + facts + breakdown */}
          <div className="animate-fade-rise">
            <p
              className="t-badge mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 uppercase"
              style={{ background: "#FFF1EE", border: "1px solid #FFD9D1", color: "#F25542" }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#FF6B57" }} aria-hidden="true" />
              Plan trip{known ? ` · ${known.tag}` : ""}
            </p>

            <h1
              className="t-hero font-display"
              style={{ color: "#0B2237" }}
            >
              Your {destination}
              <br />
              trip <span style={{ color: "#F25542" }}>plan.</span>
            </h1>

            <p className="t-body mt-4 max-w-xl" style={{ color: "#22384E" }}>
              {plan
                ? "Flights, stay and day-by-day details — all below on this page."
                : "Build your route on the Explore page — the full plan appears here."}
            </p>

            {/* Trip fact pills */}
            {pills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {pills.map(({ icon: Icon, title, sub, bg, fg }) => (
                  <div
                    key={sub}
                    className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.94)",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 4px 20px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                      style={{ background: bg, color: fg }}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="t-meta whitespace-nowrap" style={{ color: "#0B2237", fontWeight: 600 }}>{title}</p>
                      <p className="t-meta-sm whitespace-nowrap" style={{ color: "#677F93" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Flight / hotel breakdown */}
            {plan?.best_pick && (
              <div className="mt-4 grid max-w-xl gap-2.5 sm:grid-cols-2">
                <div
                  className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.94)", border: "1px solid #E5E7EB" }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                    <Plane className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="t-meta truncate" style={{ color: "#102A43", fontWeight: 600 }}>
                      {flight.airline || "Flight"} · ₹{Number(flight.price || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="t-meta-sm truncate" style={{ color: "#829AB1" }}>
                      {[flight.duration, flight.stops].filter(Boolean).join(" · ") || "Flight included"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.94)", border: "1px solid #E5E7EB" }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "#F5F3FF", color: "#8B5CF6" }}>
                    <BedDouble className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="t-meta truncate" style={{ color: "#102A43", fontWeight: 600 }}>
                      {hotel.name || "Hotel"} · ₹{Number(hotel.total_price || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="t-meta-sm truncate" style={{ color: "#829AB1" }}>
                      {hotel.rating ? `${hotel.rating}★ · ` : ""}{Number(plan.num_nights) || 1} night(s)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {plan?.best_pick && (
              <button
                type="button"
                onClick={onViewPlan}
                className="btn-primary t-btn mt-5 inline-flex h-[44px] items-center gap-2 rounded-xl px-6"
              >
                View full itinerary <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {plan?.best_pick && (
              <div className="mt-6 lg:hidden">
                <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
              </div>
            )}
          </div>

          {/* Right: live trip summary floating over the photo (desktop) */}
          <div className="hidden justify-end pt-2 lg:flex">
            <TripPreviewCard plan={plan} onViewPlan={onViewPlan} />
          </div>
        </div>
      </div>

      {/* Fade into the page background so the dashboard overlaps cleanly */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
        style={{ background: "linear-gradient(to top, #F7F9FC 0%, rgba(247,249,252,0) 100%)" }}
        aria-hidden="true"
      />
    </section>
  );
}
