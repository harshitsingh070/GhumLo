import { ArrowRight, Compass } from "lucide-react";
import Reveal from "./Reveal.jsx";

/** Final dark-navy CTA band before the footer.
 *  Props: onPlan (optional) — when provided (e.g. from sub-pages), the CTA
 *  renders a button calling it instead of the home "#plan" anchor. */
export default function CtaSection({ onPlan }) {
  return (
    <section aria-label="Start planning" className="overflow-hidden rounded-[24px] bg-ink px-6 py-14 sm:px-12 sm:py-16 dark:border dark:border-white/10">
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white" aria-hidden="true">
          <Compass className="h-7 w-7" />
        </span>
        <h2 className="font-display mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
          Your next trip doesn&apos;t have to cost more.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Tell us your destination, dates and budget. We&apos;ll help you build the trip.
        </p>
        {onPlan ? (
          <button
            type="button"
            onClick={onPlan}
            className="tcc-focus mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl bg-clay px-8 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <a
            href="#plan"
            className="tcc-focus mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl bg-clay px-8 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </Reveal>
    </section>
  );
}
