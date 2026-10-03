import { BadgeIndianRupee, Globe2, Layers, Sparkles } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ITEMS = [
  {
    icon: BadgeIndianRupee,
    title: "Real-time options",
    text: "Current flight and hotel options, checked live for your dates.",
    color: "var(--coral)",
    bg: "rgba(255, 114, 94, 0.15)",
  },
  {
    icon: Layers,
    title: "Budget-first planning",
    text: "Your budget is a constraint from the beginning — not an afterthought.",
    color: "var(--teal)",
    bg: "rgba(32, 199, 201, 0.15)",
  },
  {
    icon: Globe2,
    title: "Everything in one place",
    text: "Flights, hotels, nearby places and your itinerary together.",
    color: "var(--gold)",
    bg: "rgba(247, 201, 72, 0.15)",
  },
  {
    icon: Sparkles,
    title: "Smart discovery",
    text: "Discover destinations based on what you can actually afford.",
    color: "#B794F4",
    bg: "rgba(183, 148, 244, 0.15)",
  },
];

/** Concise trust/benefits strip in dark glass style. */
export default function Benefits() {
  return (
    <section aria-label="Why GhoomLo">
      <SectionHeading
        eyebrow="Why it works"
        title="Travel planning that respects your wallet"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((b, i) => (
          <Reveal key={b.title} delay={i * 70}>
            <div
              className="glass-card flex h-full gap-3.5 p-5 transition-transform hover:-translate-y-1"
              style={{
                background: "rgba(9, 38, 48, 0.80)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: b.bg, color: b.color }}
              >
                <b.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[15px] font-bold tracking-tight text-white">
                  {b.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                  {b.text}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
