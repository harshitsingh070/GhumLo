import { Route, Search, Wallet } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const STEPS = [
  {
    n: "01",
    icon: Search,
    eyebrow: "Live prices",
    title: "Search real flights and hotels",
    text: "Live travel sources — never sample data. What you see is what you can actually book.",
    chipBg: "#EFF6FF",
    chipColor: "#3B82F6",
  },
  {
    n: "02",
    icon: Wallet,
    eyebrow: "Match your budget",
    title: "We compare options for you",
    text: "Flight + hotel combinations are ranked by your budget first, with honest gap-closers when nothing fits.",
    chipBg: "#FFF1EE",
    chipColor: "#FF6B57",
  },
  {
    n: "03",
    icon: Route,
    eyebrow: "Get your itinerary",
    title: "A day-by-day plan, ready to go",
    text: "Nearby attractions and food spots clustered by day, with estimated costs for each stop.",
    chipBg: "#F5F3FF",
    chipColor: "#8B5CF6",
  },
];

/** Three-step product story with numbers + icons on light cards. */
export default function HowItWorks() {
  return (
    <section id="how" aria-label="How GhoomLo works" className="scroll-mt-24">
      <SectionHeading
        eyebrow="How it works"
        title="How GhoomLo works"
        subtitle="From search to itinerary, everything is built around your budget."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <article
              className="h-full rounded-[20px] bg-white p-7 transition-all hover:-translate-y-1.5"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: s.chipBg, color: s.chipColor }}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <span
                  className="font-display t-page-title text-[#EEF2F6]"
                  aria-hidden="true"
                >
                  {s.n}
                </span>
              </div>
              <p
                className="mt-5 t-badge uppercase text-[#FF6B57]"
              >
                {s.eyebrow}
              </p>
              <h3 className="font-display mt-1.5 t-subsection text-[#102A43]">
                {s.title}
              </h3>
              <p className="mt-2 t-body text-[#52606D]">
                {s.text}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
