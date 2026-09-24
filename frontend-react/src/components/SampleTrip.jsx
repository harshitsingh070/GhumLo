import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";
import sampleFort from "../assets/destinations/sample-goa-fort.jpg";

const DAYS = [
  { day: "Day 1", title: "Arrival + Baga Beach", cost: "₹2,500" },
  { day: "Day 2", title: "Fort Aguada + Candolim", cost: "₹1,800" },
  { day: "Day 3", title: "South Goa", cost: "₹2,200" },
];

/** Sample trip preview: what a real result looks like, with day cards and
 *  total. Static demo content — the CTA scrolls to the live planner. */
export default function SampleTrip() {
  return (
    <section aria-label="Sample trip preview">
      <SectionHeading
        eyebrow="Sample result"
        title="What you get: a complete trip plan"
        subtitle="Real flights, a matching stay, and a day-by-day itinerary — all within budget."
      />
      <Reveal className="mt-8">
        <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-card dark:border-white/10 dark:bg-ink">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative min-h-[260px]">
            <img
              src={sampleFort}
              alt="Fort Aguada overlooking the sea in Goa"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute left-5 top-5 rounded-full bg-ink/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              Your Goa trip
            </span>
          </div>

          {/* Summary */}
          <div className="p-7 sm:p-8">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-smoke dark:text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> 10 Oct – 13 Oct
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 2 travelers
              </span>
            </div>
            <p className="font-display mt-3 text-4xl font-extrabold tracking-tight text-ink dark:text-white">
              ₹34,440 <span className="text-base font-semibold text-smoke dark:text-white/60">total</span>
            </p>
            <ul className="mt-5 space-y-3">
              {DAYS.map((d) => (
                <li
                  key={d.day}
                  className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3 dark:bg-white/5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-smoke dark:text-white/55">
                        {d.day}
                      </span>
                      <span className="text-[15px] font-semibold text-ink dark:text-white">{d.title}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-ink dark:text-white">{d.cost}</span>
                </li>
              ))}
            </ul>
            <a
              href="#plan"
              className="tcc-focus mt-6 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:shadow sm:w-auto dark:bg-white dark:text-ink"
            >
              View complete itinerary
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
