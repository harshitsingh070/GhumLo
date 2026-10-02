import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  IndianRupee,
  MapPin,
  Plane,
  PlayCircle,
  Search,
  Users,
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

/** "Build your trip" — the main product interaction.
 *  Same defaults, validation and submit payload as before; only the
 *  presentation is new. Technical controls live under Advanced options.
 *  Props: loading, onSubmit(payload), prefillDestination. */
export default function TripForm({ loading, onSubmit, prefillDestination, onDemo, demoLoading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [dateError, setDateError] = useState("");

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
        ? fields.travel_mode
        : f.travel_mode,
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

  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-smoke";
  const inputCls =
    "tcc-focus h-[60px] w-full rounded-xl border border-line bg-cream px-4 text-[16px] font-medium text-ink placeholder:text-smoke/60 focus:border-clay focus:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:focus:bg-white/10";
  const iconCls = "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-smoke";

  return (
    <section
      aria-label="Build your trip"
      className="rounded-[20px] border border-line bg-white p-6 shadow-card sm:p-8 dark:border-white/10 dark:bg-ink"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[28px] dark:text-white">
            Build your trip
          </h2>
          <p className="mt-1 text-base text-smoke dark:text-white/65">
            Tell us where and when. We&apos;ll find the best options for your budget.
          </p>
        </div>
        <span className="rounded-full bg-sand px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ink/70 dark:bg-white/10 dark:text-white/70">
          Flight + hotel + plan
        </span>
      </div>

      {/* <div className="mb-6 grid grid-cols-3 gap-2 border-y border-line py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-smoke dark:border-white/10 dark:text-white/45 sm:text-xs">
        <span className="flex items-center gap-2 text-ink dark:text-white"><b className="flex h-6 w-6 items-center justify-center rounded-full bg-clay text-white">1</b> Route</span>
        <span className="flex items-center gap-2"><b className="flex h-6 w-6 items-center justify-center rounded-full bg-sand text-ink dark:bg-white/10 dark:text-white">2</b> Details</span>
        <span className="flex items-center gap-2"><b className="flex h-6 w-6 items-center justify-center rounded-full bg-sand text-ink dark:bg-white/10 dark:text-white">3</b> Style</span>
      </div> */}

      <form onSubmit={submit} id="trip-form">
        <NaturalLanguageInput onFill={applyNlFields} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1.3fr_0.8fr_0.9fr]">
          {/* From */}
          <div>
            <label htmlFor="trip-origin" className={labelCls}>
              From
            </label>
            <div className="relative">
              <Plane className={iconCls} aria-hidden="true" />
              <input
                id="trip-origin"
                name="origin"
                value={form.origin}
                onChange={set("origin")}
                required
                maxLength={20}
                placeholder="Delhi"
                autoComplete="off"
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>

          {/* Swap */}
          <div className="hidden items-end justify-center pb-1 xl:flex">
            <button
              type="button"
              onClick={swapOriginDest}
              title="Swap origin and destination"
              aria-label="Swap origin and destination"
              className="tcc-focus flex h-[60px] w-[52px] items-center justify-center rounded-xl border border-line text-smoke transition-colors hover:border-clay hover:text-clay dark:border-white/15 dark:hover:border-clay"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </button>
          </div>

          {/* To */}
          <div>
            <label htmlFor="trip-destination" className={labelCls}>
              To
            </label>
            <div className="relative">
              <MapPin className={iconCls} aria-hidden="true" />
              <input
                id="trip-destination"
                name="destination"
                value={form.destination}
                onChange={set("destination")}
                required
                placeholder="Goa"
                autoComplete="off"
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="md:col-span-2 xl:col-span-1">
            <span id="trip-dates-label" className={labelCls}>
              Dates
            </span>
            <div className="relative" role="group" aria-labelledby="trip-dates-label">
              <CalendarDays className={iconCls} aria-hidden="true" />
              <div className="flex flex-col justify-center gap-1 rounded-xl border border-line bg-cream px-3 py-2 pl-11 focus-within:border-clay focus-within:bg-white sm:h-[60px] sm:flex-row sm:items-center sm:py-0 dark:border-white/15 dark:bg-white/5">
                <input
                  id="trip-departure"
                  type="date"
                  value={form.departure_date}
                  onChange={(e) => {
                    set("departure_date")(e);
                    setDateError("");
                  }}
                  required
                  aria-label="Departure date"
                  className="tcc-focus min-h-[40px] w-full bg-transparent text-[16px] font-medium text-ink focus:outline-none sm:min-h-0 sm:text-sm dark:text-white"
                />
                <span className="hidden shrink-0 text-smoke sm:inline" aria-hidden="true">
                  –
                </span>
                <input
                  id="trip-return"
                  type="date"
                  value={form.return_date}
                  onChange={(e) => {
                    set("return_date")(e);
                    setDateError("");
                  }}
                  min={form.departure_date}
                  required
                  aria-label="Return date"
                  className="tcc-focus min-h-[40px] w-full bg-transparent text-[16px] font-medium text-ink focus:outline-none sm:min-h-0 sm:text-sm dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div>
            <label htmlFor="trip-travelers" className={labelCls}>
              Travelers
            </label>
            <div className="relative">
              <Users className={iconCls} aria-hidden="true" />
              <input
                id="trip-travelers"
                type="number"
                value={form.travelers}
                onChange={set("travelers")}
                min={1}
                max={9}
                required
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="trip-budget" className={labelCls}>
              Budget
            </label>
            <div className="relative">
              <IndianRupee className={iconCls} aria-hidden="true" />
              <input
                id="trip-budget"
                type="number"
                value={form.budget}
                onChange={set("budget")}
                min={1000}
                step={1000}
                required
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>
        </div>

        {dateError && (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {dateError}
          </p>
        )}

        <fieldset className="mt-6">
          <legend className={labelCls}>Travel style</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Travel style">
            {[
              ["saver", "Saver", "Lowest total"],
              ["balanced", "Balanced", "Value + comfort"],
              ["comfort", "Comfort", "Better ratings"],
            ].map(([value, title, description]) => (
              <label key={value} className={`tcc-focus cursor-pointer rounded-xl border px-4 py-3 transition-all ${form.travel_mode === value ? "border-clay bg-clay/5 shadow-sm" : "border-line bg-cream hover:border-clay/50 dark:border-white/15 dark:bg-white/5"}`}>
                <input className="sr-only" type="radio" name="travel_mode" value={value} checked={form.travel_mode === value} onChange={set("travel_mode")} />
                <span className="block text-sm font-bold text-ink dark:text-white">{title}</span>
                <span className="mt-0.5 block text-xs text-smoke dark:text-white/55">{description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* CTA row */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            id="trip-submit"
            type="submit"
            disabled={loading}
            className="tcc-focus inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-clay px-8 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-[18px] w-[18px]" />
                Find my trip →
              </>
            )}
          </button>
          <button
            type="button"
            onClick={swapOriginDest}
            className="tcc-focus inline-flex h-[50px] items-center justify-center gap-1.5 rounded-xl border border-line px-5 text-sm font-semibold text-smoke transition-colors hover:bg-sand hover:text-ink xl:hidden dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            Swap route
          </button>
          {onDemo && (
            <button
              type="button"
              onClick={onDemo}
              disabled={loading || demoLoading}
              title="Load a saved Goa trip — no API key needed"
              className="tcc-focus inline-flex h-[50px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-clay/50 px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {demoLoading ? "Loading demo…" : "Try demo trip (no key needed)"}
            </button>
          )}
        </div>

        {/* Fresh-results toggle */}
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-smoke dark:text-white/60">
          <input
            type="checkbox"
            checked={form.force_refresh}
            onChange={set("force_refresh")}
            className="h-4 w-4 rounded accent-clay"
          />
          Always fetch fresh results (slower, uses more live searches)
        </label>
      </form>
    </section>
  );
}
