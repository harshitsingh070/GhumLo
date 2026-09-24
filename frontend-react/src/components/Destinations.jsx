import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";
import { DESTINATIONS } from "../lib/destinations.js";

/** Visual destination cards: image-first, price + budget hint, hover zoom.
 *  Clicking a card prefills the planner and scrolls to it (onPick). */
export default function Destinations({ onPick }) {
  return (
    <section id="destinations" aria-label="Popular destinations" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Destinations"
          title="Popular destinations"
          subtitle="Explore places that fit different budgets."
        />
        <a
          href="#/destinations"
          className="tcc-focus inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
        >
          View all destinations
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((p, i) => (
          <Reveal key={p.name} delay={(i % 3) * 70}>
            <button
              type="button"
              onClick={() => onPick?.(p.name)}
              className="tcc-focus tcc-zoom group h-full w-full overflow-hidden rounded-[18px] border border-line bg-white text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-ink"
              aria-label={`Plan a trip to ${p.name}, ${p.tag}, ${p.price}`}
            >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={p.img}
                alt={p.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {p.price}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 p-5">
              <div>
                <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-ink dark:text-white">
                  {p.name}
                </h3>
                <p className="mt-0.5 text-sm text-smoke dark:text-white/60">{p.tag}</p>
              </div>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-smoke transition-all group-hover:border-clay group-hover:bg-clay group-hover:text-white dark:border-white/15"
                aria-hidden="true"
              >
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
