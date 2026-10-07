import CtaSection from "./CtaSection.jsx";
import HowItWorks from "./HowItWorks.jsx";
import { go } from "../lib/router.js";

/** Full How-It-Works page in light style. */
export default function HowItWorksPage() {
  return (
    <div className="tcc-page space-y-12 bg-[#F7F9FC] text-[#102A43] sm:space-y-16">
      {/* Page hero */}
      <div className="pt-4">
        <p
          className="t-badge uppercase text-[#FF6B57]"
        >
          How it works
        </p>
        <h1 className="font-display mt-2 max-w-2xl t-hero text-[#102A43]">
          Three steps to a complete trip
        </h1>
        <p className="mt-4 max-w-2xl t-body text-[#52606D]">
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
