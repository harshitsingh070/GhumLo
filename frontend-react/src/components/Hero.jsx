import { ArrowRight, Check } from "lucide-react";
import heroGoa from "../assets/destinations/hero-goa.jpg";

/** Hero: two-column travel statement + destination photography.
 *  Left: badge, display headline, description, orange CTA + secondary.
 *  Right: Goa image (24px radius) with a floating budget summary card. */
export default function Hero() {
  return (
    <section id="home" className="scroll-mt-20 bg-cream dark:bg-ink">
      <div className="tcc-container grid items-center gap-10 pb-16 pt-10 sm:pt-12 lg:grid-cols-2 lg:gap-14 lg:pb-20 lg:pt-16">
        {/* ── Left ── */}
        <div className="animate-fade-rise">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-smoke dark:border-white/15 dark:bg-white/5 dark:text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden="true" />
            Live flights · Real hotels · Smart itineraries
          </p>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl lg:text-[60px] lg:tracking-[-0.03em] dark:text-white">
            Plan better.
            <span className="block">Travel further.</span>
            <span className="block text-clay">without overspending.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-[1.6] text-smoke sm:text-lg dark:text-white/70">
            Find flights, stays and experiences that fit your budget. Compare real
            travel options and get a complete trip plan in one place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#plan"
              className="tcc-focus inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-clay px-7 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
            >
              Plan my trip
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="tcc-focus inline-flex h-[50px] items-center justify-center rounded-xl border border-line bg-white px-7 text-base font-semibold text-ink transition-colors hover:bg-sand dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              How it works
            </a>
          </div>
        </div>

        {/* ── Right: photography + floating budget card ── */}
        <div className="animate-scale-in relative">
          <img
            src={heroGoa}
            alt="Palm-fringed Goa beach at golden hour"
            className="aspect-square w-full rounded-[24px] object-cover shadow-pop sm:aspect-[4/3.4]"
            loading="eager"
          />
          <div
            className="relative z-10 ml-4 mr-auto -mt-28 max-w-[250px] rounded-2xl border border-line bg-white/95 p-5 shadow-pop backdrop-blur-sm sm:absolute sm:-bottom-6 sm:left-6 sm:mx-0 sm:mt-0 sm:w-[320px] sm:max-w-none dark:border-white/10 dark:bg-ink/95"
            aria-label="Sample Goa trip budget summary"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-smoke dark:text-white/60">
              Goa · 3 nights
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-tight text-ink dark:text-white">
              ₹34,440 <span className="text-sm font-semibold text-smoke dark:text-white/60">total</span>
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-smoke dark:text-white/60">✈&nbsp; Flight</dt>
                <dd className="font-semibold text-ink dark:text-white">₹28,532</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-smoke dark:text-white/60">🏨&nbsp; Hotel</dt>
                <dd className="font-semibold text-ink dark:text-white">₹5,908</dd>
              </div>
            </dl>
            <div className="mt-3 border-t border-line pt-3 dark:border-white/10">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-pine dark:text-emerald-300">
                <Check className="h-4 w-4" /> Within budget
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-sand dark:bg-white/10"
                role="img"
                aria-label="Trip uses 57 percent of a 60,000 rupee budget"
              >
                <div className="h-full w-[57%] rounded-full bg-pine" />
              </div>
              <p className="mt-1.5 text-xs text-smoke dark:text-white/60">57% of ₹60,000 budget</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
