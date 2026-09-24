import { BadgeIndianRupee, Globe2, Layers, Sparkles } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ITEMS = [
  {
    icon: BadgeIndianRupee,
    title: "Real-time options",
    text: "Current flight and hotel options, checked live for your dates.",
  },
  {
    icon: Layers,
    title: "Budget-first planning",
    text: "Your budget is a constraint from the beginning — not an afterthought.",
  },
  {
    icon: Globe2,
    title: "Everything in one place",
    text: "Flights, hotels, nearby places and your itinerary together.",
  },
  {
    icon: Sparkles,
    title: "Smart discovery",
    text: "Discover destinations based on what you can actually afford.",
  },
];

/** Concise trust/benefits strip. Static content. */
export default function Benefits() {
  return (
    <section aria-label="Why Trip Cost Compass">
      <SectionHeading
        eyebrow="Why it works"
        title="Travel planning that respects your wallet"
      />
      <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((b, i) => (
          <Reveal key={b.title} delay={i * 70}>
            <div className="flex gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine dark:bg-white/10 dark:text-emerald-300">
              <b.icon className="h-[22px] w-[22px]" />
            </span>
            <div>
              <h3 className="font-display text-[17px] font-bold tracking-tight text-ink dark:text-white">
                {b.title}
              </h3>
              <p className="mt-1 text-[15px] leading-relaxed text-smoke dark:text-white/65">{b.text}</p>
            </div>
          </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
