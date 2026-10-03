import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  IndianRupee,
  MapPin,
  Plane,
  PlayCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import NaturalLanguageInput from "./NaturalLanguageInput.jsx";

const DEFAULTS = {
  origin: "DEL",
  destination: "Goa",
  departure_date: "2026-10-10",
  return_date: "2026-10-13",
  travelers: 2,
  budget: 60000,
  travel_mode: "balanced",
  force_refresh: false,
};

/** Trip Builder — slim horizontal glass bar matching reference design.
 *  All form logic/validation/props unchanged. */
export default function TripForm({ loading, onSubmit, prefillDestination, onDemo, demoLoading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [dateError, setDateError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (prefillDestination) setForm((f) => ({ ...f, destination: prefillDestination }));
  }, [prefillDestination]);

  const applyNlFields = (fields) => {
    if (!fields || typeof fields !== "object") return;
    setForm((f) => ({
      ...f,
      origin: fields.origin ?? f.origin,
      destination: fields.destination ?? f.destination,
      departure_date: fields.departure_date ?? f.departure_date,
      return_date: fields.return_date ?? f.return_date,
      travelers: fields.travelers ?? f.travelers,
      budget: fields.budget ?? f.budget,
      travel_mode: ["saver", "balanced", "comfort"].includes(fields.travel_mode)
        ? fields.travel_mode : f.travel_mode,
    }));
    setDateError("");
  };

  const set = (name) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [name]: v }));
  };

  const swapOriginDest = () => {
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (form.return_date <= form.departure_date) {
      setDateError("Choose a return date after your departure date.");
      return;
    }
    setDateError("");
    onSubmit({
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departure_date: form.departure_date,
      return_date: form.return_date,
      travelers: Number(form.travelers),
      budget: Number(form.budget),
      travel_mode: form.travel_mode,
      force_refresh: Boolean(form.force_refresh),
    });
  };

  const labelCls =
    "text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap";

  const dividerCls =
    "w-px self-stretch my-3 hidden lg:block";

  /* Real visible inputs (transparent, borderless) — the old invisible
   * overlay-input trick broke typing on several browsers and mobile
   * keyboards, since users typed into an opacity-0 field. */
  const textInputCls =
    "w-full min-w-0 bg-transparent text-[15px] font-semibold outline-none placeholder:text-[var(--text-muted)]";

  const dateInputCls =
    "w-full min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none [color-scheme:dark]";

  const STYLE_OPTIONS = [
    ["saver",    "Saver",    "Lowest total"],
    ["balanced", "Balanced", "Value + comfort"],
    ["comfort",  "Comfort",  "Better ratings"],
  ];

  return (
    <section aria-label="Build your trip" id="trip-builder" className="scroll-mt-28">
      {/* Single wide glass panel — NL helper, fields, then style/options row.
          Layered glass: translucent body, lit border, inset top highlight +
          deep soft shadow so it floats above the hero. */}
      <div
        className="overflow-hidden rounded-[24px]"
        style={{
          background: "rgba(8, 32, 42, 0.86)",
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow:
            "0 28px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Natural-language helper */}
        <div
          className="px-5 pb-4 pt-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <NaturalLanguageInput onFill={applyNlFields} />
        </div>

        <form onSubmit={submit} id="trip-form">
          {/* ── Row 1: main horizontal field bar ── */}
          <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* From */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-origin">
            <span className={labelCls} style={{ color: "var(--text-muted)" }}>
              <Plane className="mb-0.5 mr-1 inline h-3 w-3" />From
            </span>
            <input
              id="trip-origin"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "var(--text-primary)" }}
              value={form.origin}
              onChange={set("origin")}
              required
              maxLength={30}
              placeholder="Delhi"
              autoComplete="off"
              aria-label="Origin city or airport"
            />
          </label>

          {/* Swap button (desktop) */}
          <button
            type="button"
            onClick={swapOriginDest}
            title="Swap origin and destination"
            aria-label="Swap origin and destination"
            className="tcc-focus hidden items-center justify-center self-center lg:flex"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>

          <div className={dividerCls} style={{ background: "rgba(255,255,255,0.08)" }} aria-hidden="true" />

          {/* To */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-destination">
            <span className={labelCls} style={{ color: "var(--text-muted)" }}>
              <MapPin className="mb-0.5 mr-1 inline h-3 w-3" />To
            </span>
            <input
              id="trip-destination"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "var(--text-primary)" }}
              value={form.destination}
              onChange={set("destination")}
              required
              maxLength={30}
              placeholder="Goa"
              autoComplete="off"
              aria-label="Destination"
            />
          </label>

          <div className={dividerCls} style={{ background: "rgba(255,255,255,0.08)" }} aria-hidden="true" />

          {/* Dates — real visible date inputs (native picker + keyboard) */}
          <div className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-[1.5]">
            <span className={labelCls} style={{ color: "var(--text-muted)" }}>
              <CalendarDays className="mb-0.5 mr-1 inline h-3 w-3" />Dates
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <input
                id="trip-departure"
                type="date"
                value={form.departure_date}
                onChange={(e) => { set("departure_date")(e); setDateError(""); }}
                required
                aria-label="Departure date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "var(--text-primary)" }}
              />
              <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>–</span>
              <input
                id="trip-return"
                type="date"
                value={form.return_date}
                onChange={(e) => { set("return_date")(e); setDateError(""); }}
                min={form.departure_date}
                required
                aria-label="Return date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div className={dividerCls} style={{ background: "rgba(255,255,255,0.08)" }} aria-hidden="true" />

          {/* Travelers */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:w-32" htmlFor="trip-travelers">
            <span className={labelCls} style={{ color: "var(--text-muted)" }}>
              <Users className="mb-0.5 mr-1 inline h-3 w-3" />Travelers
            </span>
            <input
              id="trip-travelers"
              type="number"
              value={form.travelers}
              onChange={set("travelers")}
              min={1} max={9} required
              aria-label="Number of travelers"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "var(--text-primary)" }}
            />
          </label>

          <div className={dividerCls} style={{ background: "rgba(255,255,255,0.08)" }} aria-hidden="true" />

          {/* Budget */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:w-36" htmlFor="trip-budget">
            <span className={labelCls} style={{ color: "var(--text-muted)" }}>
              <IndianRupee className="mb-0.5 mr-1 inline h-3 w-3" />Budget
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true" className="text-[15px] font-semibold" style={{ color: "var(--text-muted)" }}>₹</span>
              <input
                id="trip-budget"
                type="number"
                value={form.budget}
                onChange={set("budget")}
                min={1000} step={1000} required
                aria-label="Budget in rupees"
                className={`${textInputCls} tcc-focus rounded-md`}
                style={{ color: "var(--text-primary)" }}
              />
            </span>
          </label>

          {/* Find My Trip CTA */}
          <button
            id="trip-submit"
            type="submit"
            disabled={loading}
            className="tcc-focus btn-primary m-4 h-auto min-h-[52px] rounded-[12px] px-7 text-[15px] lg:m-0 lg:rounded-none lg:rounded-r-[23px]"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                Searching…
              </>
            ) : (
              <>
                Find my trip
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
          </div>

          {dateError && (
            <p
              className="px-5 pb-3 pt-3 text-sm font-semibold"
              role="alert"
              style={{ color: "var(--coral)" }}
            >
              {dateError}
            </p>
          )}

          {/* ── Row 2: travel style & options ── */}
          <div
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-5 py-3.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              Travel style
            </span>

            {/* Quick style pills */}
            <div className="flex flex-wrap items-center gap-2">
              {STYLE_OPTIONS.map(([value, title, desc]) => (
                <label
                  key={value}
                  title={desc}
                  className="cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all"
                  style={{
                    background: form.travel_mode === value ? "var(--coral)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${form.travel_mode === value ? "var(--coral)" : "rgba(255,255,255,0.13)"}`,
                    color: form.travel_mode === value ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="travel_mode"
                    value={value}
                    checked={form.travel_mode === value}
                    onChange={set("travel_mode")}
                  />
                  {title}
                </label>
              ))}
            </div>

            <span
              className="hidden h-5 w-px lg:block"
              style={{ background: "rgba(255,255,255,0.12)" }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              className="tcc-focus text-[12px] font-semibold transition-colors"
              style={{ color: showAdvanced ? "var(--coral)" : "var(--text-muted)" }}
            >
              {showAdvanced ? "▲ Hide options" : "▼ More options"}
            </button>

            {onDemo && (
              <button
                type="button"
                onClick={onDemo}
                disabled={loading || demoLoading}
                title="Load a saved Goa trip — no API key needed"
                className="tcc-focus ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
                style={{
                  border: "1px dashed rgba(255,114,94,0.55)",
                  color: "var(--coral)",
                  background: "transparent",
                }}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {demoLoading ? "Loading…" : "Try demo"}
              </button>
            )}
          </div>

          {showAdvanced && (
            <div
              className="animate-fade-rise flex flex-wrap items-center gap-4 px-5 py-3.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              <label className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={form.force_refresh}
                  onChange={set("force_refresh")}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--coral)" }}
                />
                Always fetch fresh results (slower, uses more live searches)
              </label>
              <button
                type="button"
                onClick={swapOriginDest}
                className="tcc-focus btn-secondary h-9 gap-1.5 rounded-xl px-4 text-[13px]"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Swap route
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
