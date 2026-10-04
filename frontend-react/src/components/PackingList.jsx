import { useState } from "react";
import { Luggage, Check } from "lucide-react";

/** Client fallback when an older cached plan has weather but no packing.
 *  Mirrors the backend bands so the UI never goes blank. */
function fallbackPacking(weather, nights) {
  const n = Math.max(1, Number(nights) || 1);
  const cond = String(weather?.condition || "");
  const low = cond.toLowerCase();
  const t = Number.parseFloat(String(weather?.temperature ?? ""));
  const wet = /rain|drizzle|shower|thunder|storm|monsoon/i.test(low)
    || String(weather?.precipitation || "").match(/\d/) != null;
  const heat = !Number.isFinite(t) ? "unknown" : t >= 30 ? "hot" : t >= 20 ? "warm" : t >= 10 ? "cool" : "cold";
  const wb = [];
  if (heat === "hot") {
    wb.push({ item: "Light cotton clothes", why: `It is ${weather.temperature}° right now.`, essential: true });
    wb.push({ item: "Cap + sunglasses + sunscreen", why: "Strong sun.", essential: true });
  } else if (heat === "cold") {
    wb.push({ item: "Heavy jacket + thermals", why: `Cold ${weather.temperature}°.`, essential: true });
  } else if (heat === "cool") {
    wb.push({ item: "Jacket + layers", why: `Cool ${weather.temperature}°.`, essential: true });
  } else {
    wb.push({ item: "T-shirts + 1 light jacket", why: "Pleasant days, cooler evenings.", essential: true });
  }
  if (wet) {
    wb.push({ item: "Umbrella or raincoat", why: `Wet signs: ${cond || weather.precipitation}.`, essential: true });
  }
  return {
    summary: `${weather.temperature ? `${weather.temperature}° ` : ""}${cond} — basics for ${n} night${n === 1 ? "" : "s"}.`,
    based_on: weather || {},
    groups: [
      { title: "Essentials", items: [{ item: "Govt photo ID", why: "Hotel + airport.", essential: true }, { item: "Phone + charger", why: "Tickets + maps.", essential: true }] },
      { title: "For this weather", items: wb },
    ],
    note: "Based on conditions observed right now — not a forecast for your travel dates.",
  };
}

/** PackingList — weather-aware checklist driven by live SerpApi weather.
 *  Backend `packing` (zero extra searches) preferred; falls back to a
 *  tiny client rule set for older cached plans. */
export default function PackingList({ packing, weather, num_nights, destination }) {
  const [ticked, setTicked] = useState(() => new Set());
  const data = packing && Array.isArray(packing.groups)
    ? packing
    : weather && (weather.temperature || weather.condition)
      ? fallbackPacking(weather, num_nights)
      : null;
  if (!data) return null;

  const based = data.based_on || weather || {};
  const chips = [];
  if (based.temperature) chips.push(`${based.temperature}°${based.unit ? String(based.unit).slice(0, 1) : "C"}`);
  if (based.condition) chips.push(String(based.condition));
  if (based.humidity) chips.push(`Humidity ${based.humidity}`);
  if (based.wind) chips.push(`Wind ${based.wind}`);
  if (based.precipitation) chips.push(`Rain ${based.precipitation}`);

  const toggle = (key) => {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section
      id="packing"
      aria-label="Weather-aware packing checklist"
      className="glass-panel scroll-mt-24 rounded-[16px] px-4 py-3.5 text-white"
      style={{ background: "rgba(9, 38, 48, 0.88)", border: "1px solid rgba(255, 255, 255, 0.12)" }}
    >
      <div className="flex items-center gap-2">
        <Luggage className="h-4 w-4 shrink-0" style={{ color: "var(--teal)" }} aria-hidden="true" />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Pack for {(destination || "this trip")} · live weather
        </p>
      </div>
      {data.summary && (
        <p className="mt-1.5 text-[13px] font-semibold leading-snug text-white">{data.summary}</p>
      )}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Weather basis">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(32,199,201,0.14)", color: "var(--teal)" }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 space-y-3">
        {(data.groups || []).map((g) => (
          <div key={g.title}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.title}</p>
            <ul className="mt-1 space-y-1">
              {(g.items || []).map((it, i) => {
                const key = `${g.title}-${it.item}-${i}`;
                const done = ticked.has(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      aria-pressed={done}
                      className="tcc-focus flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                        style={{
                          borderColor: done ? "var(--success)" : "rgba(255,255,255,0.25)",
                          background: done ? "rgba(67,209,124,0.2)" : "transparent",
                          color: "var(--success)",
                        }}
                        aria-hidden="true"
                      >
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[12px] font-semibold ${done ? "text-slate-500 line-through" : "text-slate-100"}`}>
                          {it.item}
                          {it.essential && !done && (
                            <span className="ml-1.5 rounded-full px-1.5 py-px text-[9px] font-bold" style={{ background: "rgba(255,114,94,0.15)", color: "var(--coral)" }}>
                              must
                            </span>
                          )}
                        </span>
                        {it.why && <span className="block text-[11px] leading-snug text-slate-400">{it.why}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {data.note && <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{data.note}</p>}
    </section>
  );
}
