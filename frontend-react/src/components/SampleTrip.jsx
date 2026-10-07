import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";
import sampleFort from "../assets/destinations/sample-goa-fort.jpg";

const DAYS = [
  { day: "Day 1", title: "Arrival + Baga Beach", cost: "₹2,500" },
  { day: "Day 2", title: "Fort Aguada + Candolim", cost: "₹1,800" },
  { day: "Day 3", title: "South Goa & Palolem", cost: "₹2,200" },
];

/** Sample trip preview: what a real result looks like in light cards. */
export default function SampleTrip() {
  return (
    <section aria-label="Sample trip preview">
      <SectionHeading
        eyebrow="Sample result"
        title="What you get: a complete trip plan"
        subtitle="Real flights, a matching stay, and a day-by-day itinerary — all within budget."
      />
      <Reveal className="mt-8">
        <div
          className="overflow-hidden rounded-[20px] bg-white"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative min-h-[260px]">
              <img
                src={sampleFort}
                alt="Fort Aguada overlooking the sea in Goa"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span
                className="absolute left-5 top-5 rounded-full bg-white/95 px-3.5 py-1.5 t-badge uppercase text-[#102A43]"
                style={{ border: "1px solid #E5E7EB" }}
              >
                Sample Goa Trip
              </span>
            </div>

            {/* Summary */}
            <div className="p-7 text-[#102A43] sm:p-8">
              <div className="flex flex-wrap gap-x-5 gap-y-2 t-meta text-[#52606D]">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-[#FF6B57]" /> 10 Oct – 13 Oct 2026
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#3B82F6]" /> 2 Travelers
                </span>
              </div>
              <p className="font-display mt-3 t-price-lg text-[#102A43]">
                ₹34,440 <span className="t-card text-[#829AB1]">total</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {DAYS.map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] p-3"
                    style={{
                      border: "1px solid #EEF2F6",
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-[#FF6B57]" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="mr-2 t-day text-[#829AB1]">
                          {d.day}
                        </span>
                        <span className="t-nav-active text-[#102A43]">{d.title}</span>
                      </span>
                    </span>
                    <span className="font-display shrink-0 t-price-sm text-[#52606D]">
                      {d.cost}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#/trip"
                className="btn-primary mt-6 flex h-[46px] w-full items-center justify-center gap-2 t-btn"
              >
                Plan your own trip
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
