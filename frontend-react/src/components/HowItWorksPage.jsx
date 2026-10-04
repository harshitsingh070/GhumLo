import CtaSection from "./CtaSection.jsx";
import HowItWorks from "./HowItWorks.jsx";
import { go } from "../lib/router.js";

/** Full How-It-Works page in dark glassmorphic style. */
export default function HowItWorksPage() {
  return (
    <div className="tcc-page space-y-12 sm:space-y-16 text-white">
      {/* Page hero */}
      <div className="pt-4">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: "var(--coral)" }}
        >
          How it works
        </p>
        <h1 className="font-display mt-2 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl">
          Three steps to a complete trip
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Tell us where you&apos;re going and what you can spend. We&apos;ll find
          live flights, stays and experiences that fit — then assemble the
          day-by-day plan.
        </p>
      </div>

      <HowItWorks />

      <CtaSection onPlan={() => go("trip")} />
    </div>
  );
}
