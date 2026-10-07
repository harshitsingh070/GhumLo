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
      className="scroll-mt-24 rounded-[16px] px-4 py-3.5"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
        color: "#102A43",
      }}
    >
      <p className="t-badge-sm uppercase" style={{ color: "#829AB1" }}>
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
            <CloudSun className="h-5 w-5 shrink-0" style={{ color: "#F59E0B" }} aria-hidden="true" />
          )}
          <p className="truncate t-body">
            <span className="font-display t-price-sm" style={{ color: "#102A43" }}>
              {weather.temperature}°{unit}
            </span>
            {weather.condition && (
              <span className="ml-1.5 t-meta" style={{ color: "#52606D" }}>
                {weather.condition}
              </span>
            )}
          </p>
        </div>

        {/* Humidity & Wind */}
        <div className="flex shrink-0 items-center gap-2 t-meta-sm" style={{ color: "#52606D" }}>
          {weather.humidity && (
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", color: "#1D4ED8" }}
            >
              <Droplets className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} aria-hidden="true" />
              {weather.humidity}
            </span>
          )}
          {weather.wind && (
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#6D28D9" }}
            >
              <Wind className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} aria-hidden="true" />
              {weather.wind}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
