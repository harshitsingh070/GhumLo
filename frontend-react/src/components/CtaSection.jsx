import { ArrowRight, Compass } from "lucide-react";
import Reveal from "./Reveal.jsx";

/** Final CTA band before the footer. */
export default function CtaSection({ onPlan }) {
  return (
    <section
      aria-label="Start planning"
      className="overflow-hidden rounded-[28px] bg-white px-6 py-14 sm:px-12 sm:py-16"
      style={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#FF6B57]"
          aria-hidden="true"
        >
          <Compass className="h-7 w-7" />
        </span>
        <h2 className="font-display mt-6 t-page-title text-[#102A43]">
          Your next trip doesn&apos;t have to cost more.
        </h2>
        <p className="mt-4 max-w-xl t-body text-[#52606D]">
          Tell us your destination, dates and budget. We&apos;ll help you build the trip.
        </p>
        {onPlan ? (
          <button
            type="button"
            onClick={onPlan}
            className="btn-primary mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl px-8 t-btn shadow-lg"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <a
            href="#/trip"
            className="btn-primary mt-8 inline-flex h-[52px] items-center gap-2 rounded-xl px-8 t-btn shadow-lg"
          >
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </Reveal>
    </section>
  );
}
