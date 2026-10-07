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
      className="scroll-mt-24 rounded-[16px] px-4 py-3.5"
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)", color: "#102A43" }}
    >
      <div className="flex items-center gap-2">
        <Luggage className="h-4 w-4 shrink-0" style={{ color: "#FF6B57" }} aria-hidden="true" />
        <p className="t-badge-sm uppercase" style={{ color: "#829AB1" }}>
          Pack for {(destination || "this trip")} · live weather
        </p>
      </div>
      {data.summary && (
        <p className="mt-1.5 t-body-strong" style={{ color: "#102A43" }}>{data.summary}</p>
      )}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Weather basis">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full px-2 py-0.5 t-badge-sm"
              style={{ background: "#F1F5F9", color: "#52606D", border: "1px solid #E5E7EB" }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 space-y-3">
        {(data.groups || []).map((g) => (
          <div key={g.title}>
            <p className="t-badge uppercase" style={{ color: "#829AB1" }}>{g.title}</p>
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
                      className="tcc-focus flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F9FC"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                        style={{
                          borderColor: done ? "#22C55E" : "#E5E7EB",
                          background: done ? "#ECFDF3" : "#FFFFFF",
                          color: "#15803D",
                        }}
                        aria-hidden="true"
                      >
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0">
                        <span className={`block t-label ${done ? "line-through" : ""}`} style={{ color: done ? "#829AB1" : "#102A43" }}>
                          {it.item}
                          {it.essential && !done && (
                            <span className="ml-1.5 rounded-full px-1.5 py-px t-badge-sm" style={{ background: "#FFF1EE", color: "#F25542", border: "1px solid #FED7AA" }}>
                              must
                            </span>
                          )}
                        </span>
                        {it.why && <span className="block t-meta-sm" style={{ color: "#52606D" }}>{it.why}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {data.note && <p className="mt-2 t-meta-sm" style={{ color: "#829AB1" }}>{data.note}</p>}
    </section>
  );
}
