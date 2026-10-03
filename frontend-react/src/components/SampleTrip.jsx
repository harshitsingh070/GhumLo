import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";
import sampleFort from "../assets/destinations/sample-goa-fort.jpg";

const DAYS = [
  { day: "Day 1", title: "Arrival + Baga Beach", cost: "₹2,500" },
  { day: "Day 2", title: "Fort Aguada + Candolim", cost: "₹1,800" },
  { day: "Day 3", title: "South Goa & Palolem", cost: "₹2,200" },
];

/** Sample trip preview: what a real result looks like in dark glassmorphism. */
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
          className="glass-card overflow-hidden"
          style={{
            background: "rgba(9, 38, 48, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
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
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(6,27,36,0.7) 0%, transparent 60%)",
                }}
              />
              <span
                className="absolute left-5 top-5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
              >
                Sample Goa Trip
              </span>
            </div>

            {/* Summary */}
            <div className="p-7 sm:p-8 text-white">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-[var(--coral)]" /> 10 Oct – 13 Oct 2026
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[var(--teal)]" /> 2 Travelers
                </span>
              </div>
              <p className="font-display mt-3 text-4xl font-extrabold tracking-tight text-white">
                ₹34,440 <span className="text-base font-semibold text-slate-400">total</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {DAYS.map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center justify-between gap-3 rounded-xl p-3"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--coral)]" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {d.day}
                        </span>
                        <span className="text-[13px] font-semibold text-white">{d.title}</span>
                      </span>
                    </span>
                    <span className="font-display shrink-0 text-[13px] font-bold text-slate-300">
                      {d.cost}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#plan"
                className="btn-primary mt-6 flex h-[46px] w-full items-center justify-center gap-2 text-[14px]"
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
