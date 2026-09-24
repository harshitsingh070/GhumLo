import Reveal from "./Reveal.jsx";
import SectionHeading from "./SectionHeading.jsx";

const ROWS = [
  { label: "Flights", amount: "₹28,532", pct: 48, bar: "bg-clay" },
  { label: "Hotels", amount: "₹5,908", pct: 10, bar: "bg-ink dark:bg-white" },
  { label: "Activities", amount: "₹8,000", pct: 13, bar: "bg-smoke/60" },
  { label: "Food", amount: "₹6,000", pct: 10, bar: "bg-smoke/40" },
];

/** "See where your money goes" — sample budget visualization in the new
 *  design language. Static sample content; real numbers come from search. */
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
          <div className="h-full rounded-[18px] border border-line bg-white p-7 shadow-card dark:border-white/10 dark:bg-ink">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
            Your ₹60,000 trip
          </p>
          <ul className="mt-5 space-y-5">
            {ROWS.map((r) => (
              <li key={r.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold text-ink dark:text-white">{r.label}</span>
                  <span className="text-[15px] font-bold text-ink dark:text-white">{r.amount}</span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-sand dark:bg-white/10"
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
          <div className="flex h-full flex-col justify-between gap-6 rounded-[18px] bg-pine p-7 text-white shadow-card">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Remaining</p>
            <p className="font-display mt-2 text-[40px] font-extrabold tracking-tight sm:text-5xl">₹11,560</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/85">
              You&apos;re within budget by <strong>₹11,560</strong> — room for one more
              experience, or savings in your pocket.
            </p>
          </div>
          <a
            href="#plan"
            className="tcc-focus inline-flex h-[48px] items-center justify-center rounded-xl bg-white px-6 text-[15px] font-semibold text-ink transition-all hover:-translate-y-px hover:shadow"
          >
            Plan my ₹60,000 trip →
          </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
