import { inr } from "../lib/format.js";

/** Small currency-context strip for international trips (google_finance
 *  pair). Factual + indicative only — never presented as a locked rate.
 *  Renders null when exchange_rate is missing (domestic trip or failure).
 *  Props: exchange_rate {rate, from_currency, to_currency}, budget (INR). */
export default function ExchangeRateNote({ exchange_rate: fx, budget }) {
  if (!fx || !fx.from_currency || !fx.to_currency) return null;
  const rate = Number(fx.rate);
  if (!Number.isFinite(rate) || rate <= 0) return null;

  // Budget is always in INR in this app. Show the budget conversion when the
  // fetched pair is actually INR→local; otherwise show the raw pair only
  // (converting ₹ via a non-INR pair would be wrong).
  const fromINR = fx.from_currency === "INR";
  const amount = (Number(budget) || 0) * rate;
  const fmt = (n) => {
    if (!Number.isFinite(n)) return null;
    const digits = n >= 100 ? 0 : n >= 1 ? 2 : 4;
    return n.toLocaleString("en-IN", { maximumFractionDigits: digits });
  };
  const converted = fromINR ? fmt(amount) : null;
  const rateStr = fmt(rate);

  return (
    <section
      aria-label="Currency context"
      className="rounded-[18px] border border-line bg-white px-5 py-4 shadow-card dark:border-white/10 dark:bg-ink"
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
        Currency context · {fx.from_currency} → {fx.to_currency}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-ink dark:text-white">
        {converted !== null ? (
          <>
            {inr(budget)} ≈ {converted} {fx.to_currency}
          </>
        ) : (
          <>
            1 {fx.from_currency} ≈ {rateStr} {fx.to_currency}
          </>
        )}
      </p>
      <p className="mt-0.5 text-xs text-smoke dark:text-white/55">
        Indicative rate ({rateStr} per 1 {fx.from_currency}) for context — rates move, and your
        bank or card may differ.
      </p>
    </section>
  );
}
