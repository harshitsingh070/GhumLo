import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  IndianRupee,
  MapPin,
  Plane,
  Play,
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
export default function TripForm({
  loading,
  onSubmit,
  prefillDestination,
  onDemo,
  demoLoading,
  locationError,
  onClearLocationError,
}) {
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
    onClearLocationError?.();
  };

  const set = (name) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [name]: v }));
    // Typing past a location error dismisses it — the new value revalidates.
    if ((name === "origin" || name === "destination") && locationError?.field === name) {
      onClearLocationError?.();
    }
  };

  const pickSuggestion = (name, city) => {
    if (!city) return;
    setForm((f) => ({ ...f, [name]: city }));
    onClearLocationError?.();
  };

  const swapOriginDest = () => {
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
    onClearLocationError?.();
  };

  /** Inline "unknown location" error + did-you-mean picks for one field. */
  const renderLocationError = (name) => {
    if (locationError?.field !== name) return null;
    const picks = Array.isArray(locationError.suggestions) ? locationError.suggestions : [];
    return (
      <span className="mt-1.5 block">
        <span className="block t-small" role="alert" style={{ color: "var(--color-danger)", fontWeight: 600 }}>
          {locationError.message || "We couldn't find an airport for this place."}
        </span>
        {picks.length > 0 && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="t-meta-sm" style={{ color: "#3E5463" }}>Did you mean:</span>
            {picks.map((s) => {
              const label = s?.city ? `${s.city} (${s.code})` : s?.code;
              if (!label) return null;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => pickSuggestion(name, s.city || s.code)}
                  className="tcc-focus tcc-touch rounded-full px-3 py-1.5 t-btn-sm"
                  style={{ background: "#FFFFFF", border: "1px solid var(--color-brand)", color: "#102A43" }}
                >
                  {label}
                </button>
              );
            })}
          </span>
        )}
      </span>
    );
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
      // Cached first: repeat searches return in ~1s and save SerpApi quota
      // (free tier = 250/mo). Backend still goes live on a cache miss.
      force_refresh: false,
    });
  };

  const labelCls =
    "t-label uppercase whitespace-nowrap";

  const dividerCls =
    "w-px self-stretch my-4 hidden lg:block";

  const textInputCls =
    "w-full min-w-0 bg-transparent outline-none placeholder:text-[#5B6B7B]";

  const dateInputCls =
    "w-full min-w-0 flex-1 bg-transparent outline-none [color-scheme:light]";

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
          <div className="px-4 pb-0.5 pt-4 sm:px-6 sm:pt-5">
            <h2 className="font-display t-card-lg" style={{ color: "#102A43" }}>Where are you going?</h2>
            <p className="mt-0.5 t-small" style={{ color: "#3E5463" }}>Describe it in words or fill the fields — the itinerary is built to respect your budget.</p>
          </div>
          {/* Travel AI — plain-words trip box, directly in the flow (no dropdown) */}
          <div className="px-3 pb-0.5 pt-2.5 sm:px-5 sm:pt-3">
            <NaturalLanguageInput onFill={applyNlFields} />
            {dietNote && (
              <p className="mt-2 t-small" role="status" style={{ color: "#3E5463" }}>
                {dietNote}
              </p>
            )}
          </div>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* From */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 border-b border-[#EEF2F6] px-4 py-3 sm:px-6 sm:py-4 lg:flex-1 lg:border-b-0" htmlFor="trip-origin">
            <span className={labelCls} style={{ color: "#102A43" }}>
              <Plane className="mb-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />From
            </span>
            <input
              id="trip-origin"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "#102A43", fontSize: 16, fontWeight: 600, minHeight: 32 }}
              value={form.origin}
              onChange={set("origin")}
              required
              maxLength={30}
              placeholder="Delhi"
              autoComplete="off"
              aria-label="Origin city or airport"
              aria-invalid={locationError?.field === "origin" || undefined}
              aria-describedby={locationError?.field === "origin" ? "trip-origin-error" : undefined}
            />
            <span id="trip-origin-error">{renderLocationError("origin")}</span>
          </label>

          {/* Swap — floats centered on the seam between From and To.
              Overlaps the divider on desktop; sits on the stacked seam
              on mobile (icon rotated to match the vertical flow). */}
          <div className="relative z-10 flex items-center justify-center py-1 lg:-mx-[22px] lg:my-0 lg:py-0">
            <button
              type="button"
              onClick={swapOriginDest}
              title="Swap origin and destination"
              aria-label="Swap origin and destination"
              className="tcc-focus tcc-touch flex items-center justify-center transition-colors"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                color: "#3E5463",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; e.currentTarget.style.color = "var(--color-brand)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#3E5463"; }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5 rotate-90 lg:rotate-0" />
            </button>
          </div>

          <div className={dividerCls} style={{ background: "#E5E7EB" }} aria-hidden="true" />

          {/* To — primary destination */}
          <label className="flex min-w-0 flex-col justify-center gap-1.5 border-b border-[#EEF2F6] px-4 py-3 sm:px-6 sm:py-4 lg:flex-1 lg:border-b-0" htmlFor="trip-destination">
            <span className={labelCls} style={{ color: "#102A43" }}>
              <MapPin className="mb-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />To — destination
            </span>
            <input
              id="trip-destination"
              type="text"
              className={`${textInputCls} tcc-focus rounded-md`}
              style={{ color: "#102A43", fontSize: 16, fontWeight: 700, minHeight: 32 }}
              value={form.destination}
              onChange={set("destination")}
              required
              maxLength={30}
              placeholder="Goa"
              autoComplete="off"
              aria-label="Destination — where are you going"
              aria-invalid={locationError?.field === "destination" || undefined}
              aria-describedby={locationError?.field === "destination" ? "trip-destination-error" : undefined}
            />
            <span id="trip-destination-error">{renderLocationError("destination")}</span>
          </label>

          <div className={dividerCls} style={{ background: "#E5E7EB" }} aria-hidden="true" />

          {/* Dates — primary */}
          <div className="flex min-w-0 flex-col justify-center gap-1.5 border-b border-[#EEF2F6] px-4 py-3 sm:px-6 sm:py-4 lg:flex-[1.6] lg:border-b-0">
            <span className={labelCls} style={{ color: "#102A43" }} id="trip-dates-label">
              <CalendarDays className="mb-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />When are you going?
            </span>
            <div className="flex min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center" role="group" aria-labelledby="trip-dates-label">
              <input
                id="trip-departure"
                type="date"
                value={form.departure_date}
                onChange={(e) => { set("departure_date")(e); setDateError(""); }}
                required
                aria-label="Departure date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43", fontSize: 14, fontWeight: 600, minHeight: 32 }}
              />
              <span aria-hidden="true" className="shrink-0 t-small min-[400px]:block hidden" style={{ color: "#3E5463" }}>→</span>
              <input
                id="trip-return"
                type="date"
                value={form.return_date}
                onChange={(e) => { set("return_date")(e); setDateError(""); }}
                min={form.departure_date}
                required
                aria-label="Return date"
                className={`${dateInputCls} tcc-focus rounded-md`}
                style={{ color: "#102A43", fontSize: 14, fontWeight: 600, minHeight: 32 }}
              />
            </div>
          </div>

          <div className={dividerCls} style={{ background: "#E5E7EB" }} aria-hidden="true" />

          {/* Budget — first-class, visually dominant */}
          <label
            className="mx-3 my-2 flex min-w-0 flex-col justify-center gap-1 rounded-[14px] px-4 py-2.5 sm:mx-5 sm:py-3 lg:mx-3 lg:my-3 lg:w-60"
            htmlFor="trip-budget"
            style={{ background: "var(--color-brand-bg)", border: "1px solid var(--color-brand-border)" }}
          >
            <span className={labelCls} style={{ color: "#102A43" }}>
              <IndianRupee className="mb-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Budget
            </span>
            <span className="flex min-w-0 items-baseline gap-1">
              <span aria-hidden="true" style={{ color: "#102A43", fontSize: 18, fontWeight: 700 }}>₹</span>
              <input
                id="trip-budget"
                type="number"
                value={form.budget}
                onChange={set("budget")}
                min={1000} step={1000} required
                aria-label="Budget in rupees — itinerary respects this amount"
                aria-describedby="budget-help"
                className="tcc-focus w-full min-w-0 rounded-md bg-transparent outline-none"
                style={{ color: "#102A43", fontSize: 20, fontWeight: 700, minHeight: 32 }}
              />
            </span>
            <span id="budget-help" className="t-meta" style={{ color: "#3E5463" }}>
              Itinerary respects this amount.
            </span>
          </label>

          {/* Primary search action */}
          <div className="flex flex-col justify-center gap-2 p-3 sm:p-4 lg:min-w-[176px]">
            <button
              id="trip-submit"
              type="submit"
              disabled={loading}
              className="tcc-focus btn-primary inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[12px] px-5 t-btn"
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
          {/* ── Secondary: travelers + travel style ── */}
          <div
            className="flex flex-col gap-3 px-4 py-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center min-[480px]:gap-x-4 min-[480px]:gap-y-3 sm:px-6 sm:py-4"
            style={{ borderTop: "1px solid #E5E7EB", background: "#F7F9FC" }}
          >
            <label className="flex min-w-0 items-center gap-2.5" htmlFor="trip-travelers">
              <span className="t-label uppercase" style={{ color: "#102A43" }}>
                <Users className="mb-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Travelers
              </span>
              <input
                id="trip-travelers"
                type="number"
                value={form.travelers}
                onChange={set("travelers")}
                min={1} max={9} required
                aria-label="Number of travelers"
                className="tcc-focus w-14 rounded-lg bg-white px-2 py-1.5 text-center outline-none min-h-[44px]"
                style={{ color: "#102A43", fontSize: 15, fontWeight: 700, border: "1px solid #E5E7EB" }}
              />
            </label>
            <span
              className="hidden h-6 w-px min-[480px]:block"
              style={{ background: "#D7DEE5" }}
              aria-hidden="true"
            />
            <span
              className="t-label uppercase"
              style={{ color: "#102A43" }}
              id="travel-style-label"
            >
              Travel style
            </span>

            {/* Quick style pills with visible meaning */}
            <div className="flex flex-wrap items-center gap-1.5 min-[480px]:gap-2" role="group" aria-labelledby="travel-style-label">
              {STYLE_OPTIONS.map(([value, title, desc]) => {
                const active = form.travel_mode === value;
                return (
                <label
                  key={value}
                  title={desc}
                  aria-label={`${title} — ${desc}`}
                  className="tcc-touch cursor-pointer rounded-full px-3.5 min-[480px]:px-5 t-btn transition-all"
                  style={{
                    background: active ? "var(--color-brand)" : "#FFFFFF",
                    border: `1px solid ${active ? "var(--color-brand)" : "#D7DEE5"}`,
                    color: active ? "#fff" : "#102A43",
                    minHeight: 40,
                    fontSize: 13,
                  }}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="travel_mode"
                    value={value}
                    checked={active}
                    onChange={set("travel_mode")}
                  />
                  {active ? `✓ ${title}` : title}
                </label>
                );
              })}
              <button
                type="button"
                onClick={onDemo}
                disabled={loading || demoLoading}
                className="tcc-focus tcc-touch inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full px-3.5 min-[480px]:px-5 t-btn transition-all"
                style={{ background: "#FFF8F6", border: "1px solid #FFD9D1", color: "#F25542", fontSize: 13 }}
              >
                {demoLoading ? <ButtonSpinner /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                {demoLoading ? "Loading demo..." : "Try demo trip"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </section>
  );
}
