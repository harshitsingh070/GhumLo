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
  },
  {
    n: "02",
    icon: Wallet,
    eyebrow: "Match your budget",
    title: "We compare options for you",
    text: "Flight + hotel combinations are ranked by your budget first, with honest gap-closers when nothing fits.",
  },
  {
    n: "03",
    icon: Route,
    eyebrow: "Get your itinerary",
    title: "A day-by-day plan, ready to go",
    text: "Nearby attractions and food spots clustered by day, with estimated costs for each stop.",
  },
];

/** Three-step product story with numbers + icons on dark glass cards. */
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
              className="glass-card h-full p-7 transition-all hover:-translate-y-1.5"
              style={{
                background: "rgba(9, 38, 48, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(32, 199, 201, 0.15)", color: "var(--teal)" }}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <span
                  className="font-display text-4xl font-extrabold text-white/20"
                  aria-hidden="true"
                >
                  {s.n}
                </span>
              </div>
              <p
                className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "var(--coral)" }}
              >
                {s.eyebrow}
              </p>
              <h3 className="font-display mt-1.5 text-xl font-bold tracking-tight text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-300">
                {s.text}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
