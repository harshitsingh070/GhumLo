import { ArrowRight, CalendarDays } from "lucide-react";
import CtaSection from "./CtaSection.jsx";
import Reveal from "./Reveal.jsx";
import { DESTINATIONS } from "../lib/destinations.js";
import { go } from "../lib/router.js";

/** Full Destinations page: every place with photo, story, season and
 *  starting price. "Plan this trip" prefills the home planner (onPick). */
export default function DestinationsPage({ onPick }) {
  return (
    <div className="tcc-page space-y-12 sm:space-y-16">
      {/* Page hero */}
      <div className="pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay">Destinations</p>
        <h1 className="font-display mt-2 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl dark:text-white">
          Places that fit your budget
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg dark:text-white/65">
          Six places, six budgets. Pick one and we&apos;ll build the flights,
          stay and day-by-day plan around what you can spend.
        </p>
      </div>

      {/* Detailed cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {DESTINATIONS.map((p, i) => (
          <Reveal key={p.name} delay={(i % 2) * 80}>
            <article className="tcc-zoom h-full overflow-hidden rounded-[20px] border border-line bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-ink">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img src={p.img} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
              <span className="absolute right-4 top-4 rounded-full bg-ink/70 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                {p.price}
              </span>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">{p.tag}</p>
              <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-ink dark:text-white">
                {p.name}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-smoke dark:text-white/65">{p.blurb}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-smoke dark:text-white/60">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {p.season}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => onPick?.(p.name)}
                  className="tcc-focus inline-flex h-[46px] items-center gap-2 rounded-xl bg-clay px-5 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
                >
                  Plan this trip
                  <ArrowRight className="h-4 w-4" />
                </button>
                <span className="inline-flex h-[46px] items-center rounded-xl bg-cream px-4 text-sm font-bold text-ink dark:bg-white/10 dark:text-white">
                  {p.price}
                </span>
              </div>
            </div>
          </article>
          </Reveal>
        ))}
      </div>

      <CtaSection onPlan={() => go("home", "plan")} />
    </div>
  );
}
