import { BadgeIndianRupee, Globe2, Layers, Sparkles } from "lucide-react";
import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ITEMS = [
  {
    icon: BadgeIndianRupee,
    title: "Real-time options",
    text: "Current flight and hotel options, checked live for your dates.",
    color: "#FF6B57",
    bg: "#FFF1EE",
  },
  {
    icon: Layers,
    title: "Budget-first planning",
    text: "Your budget is a constraint from the beginning — not an afterthought.",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    icon: Globe2,
    title: "Everything in one place",
    text: "Flights, hotels, nearby places and your itinerary together.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: Sparkles,
    title: "Smart discovery",
    text: "Discover destinations based on what you can actually afford.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
];

/** Concise trust/benefits strip in light card style. */
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
              className="flex h-full gap-3.5 rounded-[20px] bg-white p-5 transition-transform hover:-translate-y-1"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: b.bg, color: b.color }}
              >
                <b.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display t-activity text-[#102A43]">
                  {b.title}
                </h3>
                <p className="mt-1 t-small text-[#52606D]">
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
