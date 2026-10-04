import { ArrowRight, Compass } from "lucide-react";
import Reveal from "./Reveal.jsx";

/** Final CTA band before the footer. */
export default function CtaSection({ onPlan }) {
  return (
    <section
      aria-label="Start planning"
      className="glass-card overflow-hidden rounded-[28px] px-6 py-14 sm:px-12 sm:py-16"
      style={{
        background: "rgba(10, 39, 49, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255, 114, 94, 0.15)", color: "var(--coral)" }}
          aria-hidden="true"
        >
          <Compass className="h-7 w-7" />
        </span>
        <h2 className="font-display mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
          Your next trip doesn&apos;t have to cost more.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Tell us your destination, dates and budget. We&apos;ll help you build the trip.
        </p>
        {onPlan ? (
          <button
            type="button"
            onClick={onPlan}
            className="btn-primary mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl px-8 text-base font-bold shadow-lg"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <a
            href="#/trip"
            className="btn-primary mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl px-8 text-base font-bold shadow-lg"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </Reveal>
    </section>
  );
}
