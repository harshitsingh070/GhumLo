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
      className="glass-panel scroll-mt-24 rounded-[16px] px-4 py-3.5 text-white"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {String(place).toUpperCase()} • Current weather
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {weather.icon ? (
            <img
              src={weather.icon}
              alt=""
              aria-hidden="true"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-5 w-5 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <CloudSun className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
          )}
          <p className="truncate text-[14px]">
            <span className="font-display font-extrabold text-white">
              {weather.temperature}°{unit}
            </span>
            {weather.condition && (
              <span className="ml-1.5 text-[12px] font-medium text-slate-300">
                {weather.condition}
              </span>
            )}
          </p>
        </div>

        {/* Humidity & Wind */}
        <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-300">
          {weather.humidity && (
            <span className="inline-flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              {weather.humidity}
            </span>
          )}
          {weather.wind && (
            <span className="inline-flex items-center gap-1">
              <Wind className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {weather.wind}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
