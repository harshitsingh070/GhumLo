import { ArrowRight, CloudSun, Coins, FileText, PiggyBank, Star, Users } from "lucide-react";
import { inr, placeMapUrl } from "../lib/format.js";

/** Compact "Trip Insights" row: Day Highlights · Smart Savings · Travel Snapshot.
 *  Lives directly under the main dashboard (tight 16–20px rhythm owned by the
 *  parent wrapper) and above the AI assistant. Every number comes from the
 *  live /api/plan response — no invented values. Uses the existing glass
 *  system (glass-panel, coral/teal tokens, radius, type scale) only. */

const SAVING_LABELS = {
  CHEAPER_HOTEL: "Cheaper stay",
  CHEAPER_FLIGHT: "Cheaper flight",
  SHORTER_TRIP: "Shorter trip",
};

function addDaysISO(iso, n) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCDate(dt.getUTCDate() + n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDayShort(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(`${iso}T12:00:00`);
  return `${weekdays[d.getDay()]}, ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`;
}

function Eyebrow({ children }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.16em]"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </p>
  );
}

function Card({ label, children }) {
  return (
    <article
      aria-label={label}
      className="glass-panel min-w-0 rounded-[20px] p-5"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.11)",
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-2.5">{children}</div>
    </article>
  );
}

/** 1. Day Highlights — the currently selected itinerary day, from live data. */
function DayHighlights({ plan, activeDay }) {
  const days = Array.isArray(plan.itinerary) ? plan.itinerary : [];
  const day = days.find((d) => Number(d.day) === Number(activeDay)) ?? days[0];
  if (!day) return null;
  const stops = Array.isArray(day.places) ? day.places : [];
  const rated = stops.filter((p) => typeof p.rating === "number" && Number.isFinite(p.rating));
  const featured = [...rated].sort((a, b) => b.rating - a.rating)[0] ?? stops[0];
  const others = stops.filter((p) => p !== featured).slice(0, 2);
  const iso =
    day.date || (plan.departure_date ? addDaysISO(plan.departure_date, Number(day.day) - 1) : "");
  const dateStr = fmtDayShort(iso);
  const featuredUrl = featured ? placeMapUrl(featured) : null;

  return (
    <Card label="Day highlights">
      <p className="font-display truncate text-[17px] font-extrabold tracking-tight text-white">
        Day {day.day}
        {dateStr ? <span className="ml-2 text-[13px] font-semibold text-slate-400">{dateStr}</span> : null}
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {stops.length} stop{stops.length === 1 ? "" : "s"}
        {Number(day.distance_km) > 0 ? ` · ~${Number(day.distance_km)} km route` : ""}
      </p>
      {featured && (
        <p className="mt-2.5 flex min-w-0 items-center gap-1.5 text-[13px]">
          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-300" aria-hidden="true" />
          {featuredUrl ? (
            <a
              href={featuredUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${featured.name} — view on map`}
              className="tcc-focus min-w-0 truncate font-bold text-white hover:text-[var(--coral)] hover:underline"
            >
              {featured.name}
            </a>
          ) : (
            <span className="min-w-0 truncate font-bold text-white">{featured.name}</span>
          )}
          {typeof featured.rating === "number" && (
            <span className="shrink-0 text-[12px] font-bold text-amber-300">{featured.rating}</span>
          )}
        </p>
      )}
      {others.length > 0 && (
        <p className="mt-1 truncate text-[12px] text-slate-400" title={others.map((p) => p.name).join(" · ")}>
          Also: {others.map((p) => p.name).join(" · ")}
        </p>
      )}
    </Card>
  );
}

/** 2. Smart Savings — live totals plus the top existing cost recommendation. */
function SmartSavings({ total, cap, over, diff, suggestions }) {
  const list = Array.isArray(suggestions) ? suggestions : [];
  const best = list[0] ?? null;
  const fill = cap > 0 ? Math.min(1, total / cap) : 0;

  return (
    <Card label="Smart savings">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[22px] font-extrabold tracking-tight text-white">
          {inr(total)}
        </span>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          of {inr(cap)}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.10)" }}
        role="img"
        aria-label={`${inr(total)} of ${inr(cap)} budget`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(4, Math.round(fill * 100))}%`,
            background: over ? "var(--coral)" : "var(--teal)",
          }}
        />
      </div>
      {best ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-[13px]">
          <PiggyBank className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} aria-hidden="true" />
          <span className="font-bold" style={{ color: "var(--success)" }}>
            Save {inr(best.potential_savings)}
          </span>
          <span className="truncate text-slate-300" title={best.message}>
            · {SAVING_LABELS[best.type] ?? "Saving idea"}
          </span>
        </p>
      ) : (
        <p className="mt-2.5 text-[13px] text-slate-300">
          {over
            ? `${inr(diff)} over budget — no cheaper live combo found.`
            : "Already the cheapest live combination found."}
        </p>
      )}
      {best && (
        <a
          href="#savings"
          className="tcc-focus mt-2 inline-flex items-center gap-1 text-[12px] font-bold hover:underline"
          style={{ color: "var(--coral)" }}
        >
          {list.length > 1 ? `See all ${list.length} ways to save` : "How to save"}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </Card>
  );
}

function SnapshotRow({ icon: Icon, tint, label, value }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: tint.bg, color: tint.fg }}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="truncate text-[13px] font-bold text-white" title={typeof value === "string" ? value : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** 3. Travel Snapshot — live weather, currency, entry rules, trip size. */
function TravelSnapshot({ plan }) {
  const weather = plan.weather && (plan.weather.temperature || plan.weather.condition) ? plan.weather : null;
  const unit = (() => {
    const u = String(weather?.unit || "").toLowerCase();
    if (u.startsWith("f") || u === "f") return "F";
    return "C";
  })();
  const currency = plan.exchange_rate?.to_currency || "INR";
  const know = Array.isArray(plan.know) ? plan.know : [];
  const visaKnow = know.find((k) => /visa|entry/i.test(String(k?.title || "")));
  const entry = visaKnow
    ? /visa/i.test(visaKnow.title)
      ? "Visa rules"
      : "Entry rules"
    : know.length
      ? "See good to know"
      : null;

  return (
    <Card label="Travel snapshot">
      <div className="divide-y divide-white/[0.06]">
        <SnapshotRow
          icon={CloudSun}
          tint={{ bg: "rgba(247,201,72,0.15)", fg: "var(--gold)" }}
          label={weather?.location ? `${weather.location} now` : "Weather now"}
          value={
            weather
              ? `${weather.temperature ? `${weather.temperature}°${unit}` : ""}${weather.temperature && weather.condition ? " · " : ""}${weather.condition || ""}`.trim() || "—"
              : "Currently unavailable"
          }
        />
        <SnapshotRow
          icon={Coins}
          tint={{ bg: "rgba(32,199,201,0.15)", fg: "var(--teal)" }}
          label="Currency"
          value={currency}
        />
        <SnapshotRow
          icon={entry ? FileText : Users}
          tint={
            entry
              ? { bg: "rgba(183,148,244,0.15)", fg: "#B794F4" }
              : { bg: "rgba(255,255,255,0.07)", fg: "var(--text-secondary)" }
          }
          label={entry ? "Entry" : "Party"}
          value={
            entry ??
            `${plan.travelers} traveler${Number(plan.travelers) === 1 ? "" : "s"} · ${plan.num_nights} night${Number(plan.num_nights) === 1 ? "" : "s"}`
          }
        />
      </div>
    </Card>
  );
}

export default function TripInsights({ plan, total, cap, over, diff, activeDay }) {
  if (!plan?.best_pick) return null;
  return (
    <section
      id="insights"
      aria-label="Trip insights"
      className="grid scroll-mt-24 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5"
    >
      <DayHighlights plan={plan} activeDay={activeDay} />
      <SmartSavings total={total} cap={cap} over={over} diff={diff} suggestions={plan.suggestions} />
      <TravelSnapshot plan={plan} />
    </section>
  );
}
