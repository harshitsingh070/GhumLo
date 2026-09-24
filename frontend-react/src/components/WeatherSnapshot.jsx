import { CloudSun } from "lucide-react";

/** Compact CURRENT-conditions strip (google engine weather answer box).
 *  Honesty: this is Google's *right now* reading — explicitly NOT a
 *  forecast for the trip's dates, so the caveat is always visible.
 *  Renders null when weather is missing/empty (failure or no answer box).
 *  Props: weather {temperature, unit, condition, humidity, wind, icon,
 *  observed, location}, destination. */
export default function WeatherSnapshot({ weather, destination }) {
  if (!weather || (!weather.temperature && !weather.condition)) return null;

  const unit = (() => {
    const u = String(weather.unit || "").toLowerCase();
    if (u.startsWith("celsius") || u === "c") return "C";
    if (u.startsWith("fahrenheit") || u === "f") return "F";
    return weather.unit ? String(weather.unit).slice(0, 3) : "";
  })();
  const place = weather.location || destination || "this destination";
  const metaBits = [
    weather.humidity ? `Humidity ${weather.humidity}` : null,
    weather.wind ? `Wind ${weather.wind}` : null,
    weather.precipitation ? `Precip. ${weather.precipitation}` : null,
  ].filter(Boolean);

  return (
    <section
      aria-label="Current weather conditions"
      className="rounded-[18px] border border-line bg-white px-5 py-4 shadow-card dark:border-white/10 dark:bg-ink"
    >
      <div className="flex items-center gap-3">
        {weather.icon ? (
          <img
            src={weather.icon}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand text-ink dark:bg-white/10 dark:text-white">
            <CloudSun className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-smoke dark:text-white/55">
            Current conditions in {place}
          </p>
          <p className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-white">
            {weather.temperature}
            {unit ? `°${unit}` : ""}{" "}
            {weather.condition && (
              <span className="text-sm font-semibold text-smoke dark:text-white/60">
                {weather.condition}
              </span>
            )}
          </p>
          {metaBits.length > 0 && (
            <p className="truncate text-xs text-smoke dark:text-white/55">
              {metaBits.join(" · ")}
            </p>
          )}
        </div>
      </div>
      <p className="mt-2.5 border-t border-line pt-2 text-xs text-smoke dark:border-white/10 dark:text-white/55">
        {weather.observed ? `As of ${weather.observed} · ` : ""}
        Right now — <strong className="font-semibold">not a forecast for your travel dates</strong>.
      </p>
    </section>
  );
}
