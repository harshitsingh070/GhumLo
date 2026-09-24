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

/** Three-step product story with numbers + icons on soft contrast cards. */
export default function HowItWorks() {
  return (
    <section id="how" aria-label="How Trip Cost Compass works" className="scroll-mt-24">
      <SectionHeading
        eyebrow="How it works"
        title="How Trip Cost Compass works"
        subtitle="From search to itinerary, everything is built around your budget."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 70}>
            <article className="tcc-focus h-full rounded-[18px] border border-line bg-white p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10 dark:bg-ink">
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-ink dark:bg-white/10 dark:text-white">
                <s.icon className="h-6 w-6" />
              </span>
              <span className="font-display text-4xl font-extrabold text-line dark:text-white/15" aria-hidden="true">
                {s.n}
              </span>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-clay">{s.eyebrow}</p>
            <h3 className="font-display mt-1.5 text-xl font-bold tracking-tight text-ink dark:text-white">
              {s.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-smoke dark:text-white/65">{s.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
