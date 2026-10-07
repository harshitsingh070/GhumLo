import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ROWS = [
  { label: "Flights", amount: "₹28,532", pct: 48, bar: "bg-[#FF6B57]" },
  { label: "Hotels", amount: "₹13,908", pct: 23, bar: "bg-[#3B82F6]" },
  { label: "Activities", amount: "₹6,000", pct: 10, bar: "bg-[#F59E0B]" },
  { label: "Food & Transport", amount: "₹5,000", pct: 8, bar: "bg-[#8B5CF6]" },
];

/** "See where your money goes" — sample budget visualization in light cards. */
export default function BudgetShowcase() {
  return (
    <section aria-label="See where your money goes">
      <SectionHeading
        eyebrow="Budget breakdown"
        title="See where your money goes"
        subtitle="Every trip shows exactly how your budget is spent — no surprises."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Bars */}
        <Reveal>
          <div
            className="h-full rounded-[20px] bg-white p-7"
            style={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
            }}
          >
            <p
              className="t-badge uppercase text-[#FF6B57]"
            >
              Sample ₹60,000 trip
            </p>
            <ul className="mt-5 space-y-5">
              {ROWS.map((r) => (
                <li key={r.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="t-body-strong text-[#102A43]">{r.label}</span>
                    <span className="t-price-sm text-[#102A43]">{r.amount}</span>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]"
                    role="img"
                    aria-label={`${r.label} ${r.amount}`}
                  >
                    <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${r.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Remaining */}
        <Reveal delay={100}>
          <div
            className="flex h-full flex-col justify-between gap-6 rounded-[20px] bg-white p-7"
            style={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div>
              <p className="t-badge uppercase text-[#22C55E]">
                Remaining Buffer
              </p>
              <p className="font-display mt-2 t-price-lg text-[#102A43]">
                ₹6,560
              </p>
              <p className="mt-3 t-body text-[#52606D]">
                You&apos;re safely within budget by <strong className="text-[#102A43]">₹6,560</strong> — room for
                an extra dinner or activities on your adventure.
              </p>
            </div>
            <a
              href="#/trip"
              className="btn-primary w-fit px-6 py-3 t-btn"
            >
              Plan your trip →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
