import { useEffect, useRef, useState } from "react";
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
import { ButtonSpinner } from "./Loader.jsx";

const DEFAULTS = {
  origin: "DEL",
  destination: "Goa",
  departure_date: "2026-10-10",
  return_date: "2026-10-13",
  travelers: 2,
  budget: 60000,
  travel_mode: "balanced",
};

/** Trip Builder — light card with NL helper, fields, style/options row.
 *  All form logic/validation/props unchanged. */
export default function TripForm({ loading, onSubmit, prefillDestination, onDemo, demoLoading }) {
  const [form, setForm] = useState(DEFAULTS);
  const [dateError, setDateError] = useState("");
  // Sync guard: `loading` only disables the button after a re-render, so
  // two clicks in the same tick would fire two searches. This ref blocks
  // the second one immediately.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!loading) submittingRef.current = false;
  }, [loading]);

  useEffect(() => {
    if (prefillDestination) setForm((f) => ({ ...f, destination: prefillDestination }));
  }, [prefillDestination]);

  const [dietNote, setDietNote] = useState("");
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
    // Diet is not a backend plan constraint — surface it honestly instead
    // of silently discarding it.
    if (fields.diet) {
      setDietNote(`Food preference noted: ${fields.diet}. The planner does not filter restaurants by diet yet — check Popular Places for options.`);
    } else {
      setDietNote("");
    }
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
    if (loading || submittingRef.current) return;
    if (form.return_date <= form.departure_date) {
      setDateError("Choose a return date after your departure date.");
      return;
    }
    setDateError("");
    submittingRef.current = true;
    onSubmit({
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departure_date: form.departure_date,
      return_date: form.return_date,
      travelers: Number(form.travelers),
      budget: Number(form.budget),
      travel_mode: form.travel_mode,
      force_refresh: true,
    });
  };

  const labelCls =
    "t-label uppercase whitespace-nowrap";

  const dividerCls =
    "w-px self-stretch my-3 hidden lg:block";

  const textInputCls =
    "w-full min-w-0 bg-transparent t-input outline-none placeholder:text-[#5B6B7B]";

  const dateInputCls =
    "w-full min-w-0 flex-1 bg-transparent t-input outline-none [color-scheme:light]";

  const STYLE_OPTIONS = [
    ["saver",    "Saver",    "Lowest total"],
    ["balanced", "Balanced", "Value + comfort"],
    ["comfort",  "Comfort",  "Better ratings"],
  ];

  return (
    <section aria-label="Build your trip" id="trip-builder" className="scroll-mt-28">
      <div
        className="overflow-hidden rounded-[20px]"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 12px 32px -12px rgba(16, 42, 67, 0.18)",
        }}
      >
        <form onSubmit={submit} id="trip-form">
          {/* ── Primary: Where / When / Budget ── */}
          <div className="px-5 pb-2 pt-5">
            <h2 className="font-display t-card-lg" style={{ color: "#102A43" }}>Where are you going?</h2>
            <p className="t-small" style={{ color: "#3E5463" }}>Route, dates and budget — the itinerary is built to respect your budget.</p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* From */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-origin">
            <span className={labelCls} style={{ color: "#5B6B7B" }}>
              <Plane className="mb-0.5 mr-1 inline h-3 w-3" />From
            </span>
            <input
              id="trip-origin"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "#102A43" }}
              value={form.origin}
              onChange={set("origin")}
              required
              maxLength={30}
              placeholder="Delhi"
              autoComplete="off"
              aria-label="Origin city or airport"
            />
          </label>

          {/* Swap — available on mobile and desktop */}
          <div className="flex items-center justify-center px-5 lg:px-0">
            <button
              type="button"
              onClick={swapOriginDest}
              title="Swap origin and destination"
              aria-label="Swap origin and destination"
              className="tcc-focus tcc-touch flex items-center justify-center self-center transition-colors"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#F1F5F9",
                border: "1px solid #E5E7EB",
                color: "#3E5463",
                flexShrink: 0,
              }}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* To — primary destination */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-destination">
            <span className={labelCls} style={{ color: "#102A43" }}>
              <MapPin className="mb-0.5 mr-1 inline h-3 w-3" />To — destination
            </span>
            <input
              id="trip-destination"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "#102A43", fontWeight: 600 }}
              value={form.destination}
              onChange={set("destination")}
              required
              maxLength={30}
              placeholder="Goa"
              autoComplete="off"
              aria-label="Destination — where are you going"
            />
          </label>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* Dates — primary */}
          <div className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-[1.5]">
            <span className={labelCls} style={{ color: "#102A43" }} id="trip-dates-label">
              <CalendarDays className="mb-0.5 mr-1 inline h-3 w-3" />When are you going?
            </span>
            <div className="flex min-w-0 items-center gap-2" role="group" aria-labelledby="trip-dates-label">
              <input
                id="trip-departure"
                type="date"
                value={form.departure_date}
                onChange={(e) => { set("departure_date")(e); setDateError(""); }}
                required
                aria-label="Departure date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43" }}
              />
              <span aria-hidden="true" style={{ color: "#5B6B7B" }}>–</span>
              <input
                id="trip-return"
                type="date"
                value={form.return_date}
                onChange={(e) => { set("return_date")(e); setDateError(""); }}
                min={form.departure_date}
                required
                aria-label="Return date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43" }}
              />
            </div>
          </div>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* Budget — first-class, visually dominant */}
          <label
            className="flex min-w-0 flex-col justify-center gap-1.5 rounded-[14px] px-5 py-4 lg:w-52"
            htmlFor="trip-budget"
            style={{ background: "var(--color-brand-bg)", border: "1px solid var(--color-brand-border)" }}
          >
            <span className={labelCls} style={{ color: "#102A43" }}>
              <IndianRupee className="mb-0.5 mr-1 inline h-3 w-3" />What&apos;s your budget?
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true" className="t-activity" style={{ color: "#102A43" }}>₹</span>
              <input
                id="trip-budget"
                type="number"
                value={form.budget}
                onChange={set("budget")}
                min={1000} step={1000} required
                aria-label="Budget in rupees — itinerary respects this amount"
                aria-describedby="budget-help"
                className={`${textInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43", fontWeight: 700 }}
              />
            </span>
            <span id="budget-help" className="t-meta-sm" style={{ color: "#3E5463" }}>
              Itinerary respects this amount.
            </span>
          </label>

          {/* Find My Trip CTA */}
          <button
            id="trip-submit"
            type="submit"
            disabled={loading}
            className="tcc-focus btn-primary m-4 h-auto min-h-[52px] rounded-[12px] px-7 t-btn lg:m-3"
          >
            {loading ? (
              <>
                <ButtonSpinner />
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
              className="px-5 pb-3 pt-3 t-body-strong"
              role="alert"
              style={{ color: "var(--color-danger)" }}
            >
              {dateError}
            </p>
          )}
          {dietNote && (
            <p className="px-5 pb-3 t-small" role="status" style={{ color: "#3E5463" }}>
              {dietNote}
            </p>
          )}

          {/* ── Secondary: travelers + travel style ── */}
          <div
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-5 py-3.5"
            style={{ borderTop: "1px solid #EEF2F6", background: "#F7F9FC" }}
          >
            <label className="flex min-w-0 items-center gap-2" htmlFor="trip-travelers">
              <span className="t-badge uppercase" style={{ color: "#5B6B7B" }}>
                <Users className="mb-0.5 mr-1 inline h-3 w-3" />Travelers
              </span>
              <input
                id="trip-travelers"
                type="number"
                value={form.travelers}
                onChange={set("travelers")}
                min={1} max={9} required
                aria-label="Number of travelers"
                className="tcc-focus w-16 rounded-md bg-transparent t-input outline-none"
                style={{ color: "#102A43" }}
              />
            </label>
            <span
              className="hidden h-5 w-px lg:block"
              style={{ background: "#E5E7EB" }}
              aria-hidden="true"
            />
            <span
              className="t-badge uppercase"
              style={{ color: "#5B6B7B" }}
              id="travel-style-label"
            >
              Travel style
            </span>

            {/* Quick style pills with visible meaning */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="travel-style-label">
              {STYLE_OPTIONS.map(([value, title, desc]) => (
                <label
                  key={value}
                  title={desc}
                  aria-label={`${title} — ${desc}`}
                  className="tcc-touch cursor-pointer rounded-full px-4 t-btn-sm transition-all"
                  style={{
                    background: form.travel_mode === value ? "var(--color-brand)" : "#FFFFFF",
                    border: `1px solid ${form.travel_mode === value ? "var(--color-brand)" : "#E5E7EB"}`,
                    color: form.travel_mode === value ? "#fff" : "#3E5463",
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
          </div>

          {/* ── Progressive disclosure: NL + demo ── */}
          <details className="px-5 py-3.5" style={{ borderTop: "1px solid #EEF2F6" }}>
            <summary className="tcc-focus cursor-pointer t-btn-sm" style={{ color: "#102A43" }}>
              Describe in words or try a demo (optional)
            </summary>
            <div className="pt-3">
              <NaturalLanguageInput onFill={applyNlFields} />
              {onDemo && (
                <button
                  type="button"
                  onClick={onDemo}
                  disabled={loading || demoLoading}
                  title="Load a saved Goa trip — no API key needed"
                  className="tcc-focus tcc-touch mt-2.5 inline-flex items-center gap-1.5 rounded-full px-4 t-btn-sm transition-all disabled:opacity-50"
                  style={{
                    border: "1px dashed rgba(255,107,87,0.55)",
                    color: "var(--color-brand)",
                    background: "var(--color-brand-bg)",
                  }}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {demoLoading ? "Loading…" : "Try demo trip (no key needed)"}
                </button>
              )}
            </div>
          </details>

        </form>
      </div>
    </section>
  );
}
