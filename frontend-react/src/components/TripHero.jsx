import { useEffect, useState } from "react";
import { CalendarDays, Users, Wallet, Plane, BedDouble, ArrowRight } from "lucide-react";
import { DESTINATIONS, photoPoolFor } from "../lib/destinations.js";
import { fmtDateRange, inr } from "../lib/format.js";
import { HeroEyebrow, HeroVeil, HeroShell } from "./HeroShared.jsx";
import TripPreviewCard from "./TripPreviewCard.jsx";

/** Light trip hero — destination image card + navy heading, trip facts,
 *  flight/hotel breakdown and primary CTA. Communicates where / when /
 *  how many / cost / action at a glance. */
export default function TripHero({ plan, onViewPlan }) {
  const destination = plan?.destination || "Goa";
  const photos = photoPoolFor(destination);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
    if (photos.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setPhotoIndex((index) => (index + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [destination]);

  const img = photos[photoIndex] || photos[0];
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
          title: fmtDateRange(plan.departure_date, plan.return_date) || "Trip dates",
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
          title: total > 0 ? inr(total) : "—",
          sub: "Total estimated cost",
          bg: "var(--color-success-bg)",
          fg: "var(--color-success)",
        },
      ]
    : [];

  return (
    <HeroShell id="trip-hero" minHeight="clamp(520px, 75vh, 640px)">
      {/* Full-background destination image */}
      <img
        src={img}
        alt={known ? known.alt : `${destination} destination`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        style={{ objectPosition: "center 38%", filter: "contrast(1.06) saturate(1.08)" }}
      />

      <HeroVeil />

      {/* Content — flows naturally on mobile */}
      <div className="tcc-container relative z-10 flex min-h-[clamp(520px,75vh,640px)] items-start pb-32 pt-[118px] sm:pb-44">
        <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: heading + facts + breakdown */}
          <div className="animate-fade-rise">
            <HeroEyebrow>Plan trip{known ? ` · ${known.tag}` : ""}</HeroEyebrow>

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
                    <p className="t-meta-sm truncate" style={{ color: "#5B6B7B" }}>
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
                    <p className="t-meta-sm truncate" style={{ color: "#5B6B7B" }}>
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
    </HeroShell>
  );
}
