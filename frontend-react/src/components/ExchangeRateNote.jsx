import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { inr } from "../lib/format.js";

/** Live currency converter for international trips — fixed plan pair
 *  (e.g. INR → GBP), no currency pickers: type an amount, see it converted
 *  at the live google_finance rate. */
export default function ExchangeRateNote({ exchange_rate: fx, budget }) {
  const [amount, setAmount] = useState(Number(budget) || 0);
  useEffect(() => { setAmount(Number(budget) || 0); }, [budget]);

  if (!fx || !fx.from_currency || !fx.to_currency) return null;
  const rate = Number(fx.rate);
  if (!Number.isFinite(rate) || rate <= 0) return null;

  const fromINR = fx.from_currency === "INR";
  const fmt = (n) => {
    if (!Number.isFinite(n)) return null;
    const digits = n >= 100 ? 0 : n >= 1 ? 2 : 4;
    return n.toLocaleString("en-IN", { maximumFractionDigits: digits });
  };
  const converted = fmt(Number(amount) * rate);
  const headline = fromINR ? fmt(Number(budget) * rate) : null;
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
            {headline !== null ? (
              <>
                {inr(budget)} ≈ <span style={{ color: "#15803D" }}>{headline} {fx.to_currency}</span>
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

      {/* Real-time converter — fixed pair, type any amount */}
      <div className="mt-4 flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1" htmlFor="fx-amount">
          <span className="t-label uppercase" style={{ color: "#5B6B7B" }}>Amount in {fx.from_currency}</span>
          <input
            id="fx-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            className="tcc-focus min-w-0 rounded-lg bg-white px-3 py-2 outline-none"
            style={{ color: "#102A43", fontSize: 15, fontWeight: 700, border: "1px solid #D7DEE5" }}
          />
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-label uppercase" style={{ color: "#5B6B7B" }}>Converted to {fx.to_currency}</span>
          <output
            aria-live="polite"
            className="min-w-0 truncate rounded-lg px-3 py-2"
            style={{ background: "#ECFDF3", border: "1px solid #A7F3D0", color: "#15803D", fontSize: 15, fontWeight: 700 }}
          >
            {converted ?? "—"} {fx.to_currency}
          </output>
        </div>
      </div>
    </section>
  );
}
