import { CloudSun, Droplets, Wind } from "lucide-react";

/** WeatherSnapshot — Compact dark glass weather card (Section 22). */
export default function WeatherSnapshot({ weather, destination }) {
  if (!weather || (!weather.temperature && !weather.condition)) return null;

  const unit = (() => {
    const u = String(weather.unit || "").toLowerCase();
    if (u.startsWith("celsius") || u === "c") return "C";
    if (u.startsWith("fahrenheit") || u === "f") return "F";
    return weather.unit ? String(weather.unit).slice(0, 3) : "C";
  })();
  const place = weather.location || destination || "Destination";

  return (
    <section
      id="weather"
      aria-label="Current weather conditions"
      className="glass-panel scroll-mt-24 rounded-[20px] p-5 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {weather.icon ? (
            <img
              src={weather.icon}
              alt=""
              aria-hidden="true"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-11 w-11 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "rgba(247, 201, 72, 0.15)", color: "var(--gold)" }}
            >
              <CloudSun className="h-6 w-6" />
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {place} · Current Weather
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-black tracking-tight text-white">
                {weather.temperature}°{unit}
              </span>
              {weather.condition && (
                <span className="text-sm font-semibold text-slate-300">
                  {weather.condition}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Humidity & Wind */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {weather.humidity && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/5 border border-white/10">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              Humidity {weather.humidity}
            </span>
          )}
          {weather.wind && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/5 border border-white/10">
              <Wind className="h-3.5 w-3.5 text-teal-400" />
              Wind {weather.wind}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
