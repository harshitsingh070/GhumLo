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
      className="card-quiet w-full rounded-[20px] p-5"
      style={{ color: "#102A43" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "#ECFDF3", color: "#15803D", border: "1px solid #A7F3D0" }}
        >
          <Coins className="h-5 w-5" />
        </span>
        <div>
          <p className="t-badge uppercase" style={{ color: "#5B6B7B" }}>
            Currency conversion · {fx.from_currency} → {fx.to_currency}
          </p>
          <p className="mt-0.5 t-price-sm" style={{ color: "#102A43" }}>
            {converted !== null ? (
              <>
                {inr(budget)} ≈ <span style={{ color: "#15803D" }}>{converted} {fx.to_currency}</span>
              </>
            ) : (
              <>
                1 {fx.from_currency} ≈ <span style={{ color: "#15803D" }}>{rateStr} {fx.to_currency}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 t-meta-sm" style={{ color: "#52606D" }}>
            Live indicative rate ({rateStr} per 1 {fx.from_currency}) for budget planning.
          </p>
        </div>
      </div>
    </section>
  );
}
