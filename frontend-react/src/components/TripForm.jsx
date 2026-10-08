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
    "w-full min-w-0 bg-transparent t-input outline-none placeholder:text-[#829AB1]";

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
        {/* Natural-language helper */}
        <div
          className="px-5 pb-4 pt-5"
          style={{ borderBottom: "1px solid #EEF2F6" }}
        >
          <NaturalLanguageInput onFill={applyNlFields} />
        </div>

        <form onSubmit={submit} id="trip-form">
          {/* ── Row 1: main horizontal field bar ── */}
          <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* From */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-origin">
            <span className={labelCls} style={{ color: "#829AB1" }}>
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

          {/* Swap button (desktop) */}
          <button
            type="button"
            onClick={swapOriginDest}
            title="Swap origin and destination"
            aria-label="Swap origin and destination"
            className="tcc-focus hidden items-center justify-center self-center transition-colors lg:flex"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#F1F5F9",
              border: "1px solid #E5E7EB",
              color: "#52606D",
              flexShrink: 0,
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* To */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-1" htmlFor="trip-destination">
            <span className={labelCls} style={{ color: "#829AB1" }}>
              <MapPin className="mb-0.5 mr-1 inline h-3 w-3" />To
            </span>
            <input
              id="trip-destination"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "#102A43" }}
              value={form.destination}
              onChange={set("destination")}
              required
              maxLength={30}
              placeholder="Goa"
              autoComplete="off"
              aria-label="Destination"
            />
          </label>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* Dates */}
          <div className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:flex-[1.5]">
            <span className={labelCls} style={{ color: "#829AB1" }}>
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
                style={{ color: "#102A43" }}
              />
              <span aria-hidden="true" style={{ color: "#829AB1" }}>–</span>
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

          {/* Travelers */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:w-32" htmlFor="trip-travelers">
            <span className={labelCls} style={{ color: "#829AB1" }}>
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
              style={{ color: "#102A43" }}
            />
          </label>

          <div className={dividerCls} style={{ background: "#EEF2F6" }} aria-hidden="true" />

          {/* Budget */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 lg:w-36" htmlFor="trip-budget">
            <span className={labelCls} style={{ color: "#829AB1" }}>
              <IndianRupee className="mb-0.5 mr-1 inline h-3 w-3" />Budget
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true" className="t-activity" style={{ color: "#829AB1" }}>₹</span>
              <input
                id="trip-budget"
                type="number"
                value={form.budget}
                onChange={set("budget")}
                min={1000} step={1000} required
                aria-label="Budget in rupees"
                className={`${textInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43" }}
              />
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
              style={{ color: "#F25542" }}
            >
              {dateError}
            </p>
          )}

          {/* ── Row 2: travel style & options ── */}
          <div
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-5 py-3.5"
            style={{ borderTop: "1px solid #EEF2F6", background: "#F7F9FC" }}
          >
            <span
              className="t-badge uppercase"
              style={{ color: "#829AB1" }}
            >
              Travel style
            </span>

            {/* Quick style pills */}
            <div className="flex flex-wrap items-center gap-2">
              {STYLE_OPTIONS.map(([value, title, desc]) => (
                <label
                  key={value}
                  title={desc}
                  className="cursor-pointer rounded-full px-3.5 py-1.5 t-btn-sm transition-all"
                  style={{
                    background: form.travel_mode === value ? "#FF6B57" : "#FFFFFF",
                    border: `1px solid ${form.travel_mode === value ? "#FF6B57" : "#E5E7EB"}`,
                    color: form.travel_mode === value ? "#fff" : "#52606D",
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
              style={{ background: "#E5E7EB" }}
              aria-hidden="true"
            />

            {onDemo && (
              <button
                type="button"
                onClick={onDemo}
                disabled={loading || demoLoading}
                title="Load a saved Goa trip — no API key needed"
                className="tcc-focus ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 t-btn-sm transition-all disabled:opacity-50"
                style={{
                  border: "1px dashed rgba(255,107,87,0.55)",
                  color: "#FF6B57",
                  background: "#FFF1EE",
                }}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                {demoLoading ? "Loading…" : "Try demo"}
              </button>
            )}
          </div>

        </form>
      </div>
    </section>
  );
}
