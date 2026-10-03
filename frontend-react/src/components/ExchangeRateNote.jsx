import { Coins } from "lucide-react";
import { inr } from "../lib/format.js";

/** Small currency-context strip for international trips. */
export default function ExchangeRateNote({ exchange_rate: fx, budget }) {
  if (!fx || !fx.from_currency || !fx.to_currency) return null;
  const rate = Number(fx.rate);
  if (!Number.isFinite(rate) || rate <= 0) return null;

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
      className="glass-panel rounded-[20px] p-5 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(32, 199, 201, 0.15)", color: "var(--teal)" }}
        >
          <Coins className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Currency conversion · {fx.from_currency} → {fx.to_currency}
          </p>
          <p className="mt-0.5 text-[15px] font-bold text-white">
            {converted !== null ? (
              <>
                {inr(budget)} ≈ <span className="text-[var(--teal)]">{converted} {fx.to_currency}</span>
              </>
            ) : (
              <>
                1 {fx.from_currency} ≈ <span className="text-[var(--teal)]">{rateStr} {fx.to_currency}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Live indicative rate ({rateStr} per 1 {fx.from_currency}) for budget planning.
          </p>
        </div>
      </div>
    </section>
  );
}
