import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ROWS = [
  { label: "Flights", amount: "₹28,532", pct: 48, bar: "bg-[var(--coral)]" },
  { label: "Hotels", amount: "₹13,908", pct: 23, bar: "bg-[var(--teal)]" },
  { label: "Activities", amount: "₹6,000", pct: 10, bar: "bg-amber-400" },
  { label: "Food & Transport", amount: "₹5,000", pct: 8, bar: "bg-blue-400" },
];

/** "See where your money goes" — sample budget visualization in dark glass. */
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
            className="glass-card h-full p-7"
            style={{
              background: "rgba(9, 38, 48, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--coral)" }}
            >
              Sample ₹60,000 trip
            </p>
            <ul className="mt-5 space-y-5">
              {ROWS.map((r) => (
                <li key={r.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-semibold text-white">{r.label}</span>
                    <span className="text-[14px] font-bold text-white">{r.amount}</span>
                  </div>
                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
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
            className="glass-card flex h-full flex-col justify-between gap-6 p-7 text-white"
            style={{
              background: "rgba(10, 50, 62, 0.90)",
              border: "1px solid rgba(32, 199, 201, 0.3)",
            }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--teal)]">
                Remaining Buffer
              </p>
              <p className="font-display mt-2 text-[40px] font-extrabold tracking-tight sm:text-5xl text-white">
                ₹6,560
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
                You&apos;re safely within budget by <strong className="text-white">₹6,560</strong> — room for
                an extra dinner or activities on your adventure.
              </p>
            </div>
            <a
              href="#/trip"
              className="btn-primary w-fit px-6 py-3 text-[13px] font-bold"
            >
              Plan your trip →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
