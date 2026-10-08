import { useRef, useState } from "react";
import { navigate, useHashRoute } from "./lib/router.js";
import { apiRequest, friendlyError } from "./lib/api.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import DestinationsPage from "./components/DestinationsPage.jsx";
import HowItWorksPage from "./components/HowItWorksPage.jsx";
import BudgetShowcase from "./components/BudgetShowcase.jsx";
import SampleTrip from "./components/SampleTrip.jsx";
import Benefits from "./components/Benefits.jsx";
import CtaSection from "./components/CtaSection.jsx";
import About from "./components/About.jsx";
import Footer from "./components/Footer.jsx";
import GhumiGhumiAI from "./components/GhumiGhumiAI.jsx";
import PrintableTrip from "./components/PrintableTrip.jsx";
import TripPage from "./components/TripPage.jsx";
import TripForm from "./components/TripForm.jsx";
import TripHero from "./components/TripHero.jsx";

/** Top-level layout. Holds plan result, loading, and error state.
 *  POSTs to same-origin /api/plan — no axios, no state library. */
export default function App() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState("");
  // Last submitted form values (without selected_hotel_name). Kept so the
  // hotel picker can re-POST the identical trip plus a chosen hotel name.
  const lastPayloadRef = useRef(null);
  // Monotonic request id: a stale recompute resolving after a fresh form
  // submit must not overwrite the newer plan.
  const reqIdRef = useRef(0);
  // Abort handle for the in-flight /api/plan call: starting a newer search
  // cancels the older one so duplicate clicks can never run two live
  // searches against each other (double quota burn + racing results).
  const planAbortRef = useRef(null);
  // Destination-card prefill: sets the Explore form's destination field,
  // jumps to the Explore page, and scrolls the form into view.
  const [prefillDestination, setPrefillDestination] = useState("");
  const route = useHashRoute();
  const pickDestination = (name) => {
    if (!name) return;
    setPrefillDestination(name);
    if (route !== "home") {
      navigate("home");
      setTimeout(
        () => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }),
        200
      );
    } else {
      document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const postPlan = async (payload, signal) => {
    // Live plan search can fan out to many provider calls — allow 3 min.
    return apiRequest("/api/plan", {
      method: "POST",
      body: payload,
      timeoutMs: 180000,
      signal,
    });
  };

  /** Start a plan request with supersede semantics: any previous in-flight
   *  plan call is aborted first, so exactly one search is ever live. */
  const startPlanRequest = (payload) => {
    planAbortRef.current?.abort();
    const ctrl = new AbortController();
    planAbortRef.current = ctrl;
    return postPlan(payload, ctrl.signal);
  };

  /** Cancel a long-running plan: abort, invalidate stale, keep form data. */
  const handleCancel = () => {
    planAbortRef.current?.abort();
    reqIdRef.current += 1;
    setLoading(false);
    setError("");
    // Do not clear lastPayloadRef — user returns to planner with data intact.
    // Cancellation is not an error, so no error state is set.
  };

  const handleSubmit = async (payload) => {
    const id = ++reqIdRef.current;
    lastPayloadRef.current = payload;
    // Load first, redirect after: the button shows "Searching…" on the
    // current page, and we only jump to /trip once details are ready.
    // Navigate to trip immediately so Cancel + honest progress are visible.
    if (route !== "trip") navigate("trip");
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      // Fresh trip: auto-selection path (no selected_hotel_name), so any
      // previous hotel choice resets by construction — the new response
      // carries selected_hotel_name: null and the picker highlights the
      // new auto pick.
      const data = await startPlanRequest(payload);
      if (reqIdRef.current === id) {
        setPlan(data);
        if (route !== "trip") navigate("trip");
        setTimeout(
          () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
          200
        );
      }
    } catch (err) {
      if (reqIdRef.current === id && !err?.aborted) {
        setError(friendlyError(err));
        // Errors render on the trip page, so still redirect there.
        if (route !== "trip") navigate("trip");
      }
    } finally {
      if (reqIdRef.current === id) setLoading(false);
    }
  };

  const selectHotel = async (name) => {
    const base = lastPayloadRef.current;
    // Effective hotel, server-confirmed: explicit echo, else auto best pick.
    const current = plan?.selected_hotel_name ?? plan?.best_pick?.hotel?.name;
    if (!base || recomputing || !name || name === current) return;
    const id = ++reqIdRef.current;
    setRecomputing(true);
    setError("");
    try {
      // Same trip params + chosen hotel. Flights/hotels hit the trip's
      // existing cache; places are searched near the new hotel's anchor
      // (cached when previously searched, else 2 live searches).
      const data = await startPlanRequest({
        ...base,
        travel_mode: plan?.travel_mode ?? base.travel_mode,
        selected_hotel_name: name,
      });
      if (reqIdRef.current === id) {
        lastPayloadRef.current = {
          ...base,
          travel_mode: data.travel_mode ?? base.travel_mode,
          selected_hotel_name: data.selected_hotel_name ?? name,
        };
        setPlan(data);
      }
    } catch (err) {
      // Keep the previous plan on screen — a failed swap must not nuke
      // working results; surface the message above them. Aborted
      // (superseded) requests stay silent.
      if (reqIdRef.current === id && !err?.aborted) setError(friendlyError(err));
    } finally {
      if (reqIdRef.current === id) setRecomputing(false);
    }
  };

  const selectAlternative = async (option) => {
    const base = lastPayloadRef.current;
    if (!base || recomputing || !option?.mode || option.mode === plan?.travel_mode) return;
    const id = ++reqIdRef.current;
    setRecomputing(true);
    setError("");
    try {
      const data = await startPlanRequest({ ...base, travel_mode: option.mode, selected_hotel_name: null });
      if (reqIdRef.current === id) {
        lastPayloadRef.current = { ...base, travel_mode: data.travel_mode ?? option.mode, selected_hotel_name: null };
        setPlan(data);
      }
    } catch (err) {
      if (reqIdRef.current === id && !err?.aborted) setError(friendlyError(err));
    } finally {
      if (reqIdRef.current === id) setRecomputing(false);
    }
  };

  const handleDemo = async () => {
    const id = ++reqIdRef.current;
    // Same load-then-redirect flow as a manual search.
    setDemoLoading(true);
    setError("");
    setPlan(null);
    try {
      const data = await apiRequest("/api/demo", { timeoutMs: 30000 });
      if (reqIdRef.current === id) {
        lastPayloadRef.current = {
          origin: data.origin,
          destination: data.destination,
          departure_date: data.departure_date,
          return_date: data.return_date,
          travelers: data.travelers,
          budget: data.budget,
          travel_mode: data.travel_mode || "balanced",
          force_refresh: false,
        };
        setPlan(data);
        if (route !== "trip") navigate("trip");
        setTimeout(
          () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
          200
        );
      }
    } catch (err) {
      if (reqIdRef.current === id) {
        setError(friendlyError(err, "Demo unavailable."));
        if (route !== "trip") navigate("trip");
      }
    } finally {
      if (reqIdRef.current === id) setDemoLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <div
      className="min-h-screen font-sans"
      style={{
        backgroundColor: "#F7F9FC",
        color: "#102A43",
      }}
    >
      <Header />
      {route === "home" && (
        <Hero
          plan={plan}
          onViewPlan={() => navigate("trip")}
        />
      )}
      {route === "trip" && (
        <TripHero
          plan={plan}
          onViewPlan={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}
        />
      )}

      <main
        className={`tcc-container space-y-12 pb-24 sm:space-y-16 ${
          route === "home" || route === "trip" ? "pt-4 sm:pt-6" : "pt-[104px]"
        }`}
      >
        {route === "destinations" && <DestinationsPage onPick={pickDestination} />}
        {route === "how" && <HowItWorksPage />}

        {route === "trip" && (
          <>
            <TripPage
              plan={plan}
              loading={loading}
              recomputing={recomputing}
              error={error}
              lastBudget={lastPayloadRef.current?.budget}
              onSelectHotel={selectHotel}
              onSelectAlternative={selectAlternative}
              onCancel={handleCancel}
            />
            {/* Keep supporting sections under the full trip details */}
            {plan && !loading && <Benefits />}
            <About />
          </>
        )}

        {route === "home" && (
          <>
            {/* Trip builder on Explore — flows naturally on mobile. */}
            <div id="plan" className="relative z-20 -mt-16 scroll-mt-28 sm:-mt-24">
              <TripForm
                loading={loading}
                onSubmit={handleSubmit}
                prefillDestination={prefillDestination}
                onDemo={handleDemo}
                demoLoading={demoLoading}
              />
            </div>
            {/* Landing story */}
            <BudgetShowcase />
            <SampleTrip />
            <Benefits />
            <About />
            <CtaSection />
          </>
        )}
      </main>

      <Footer />

      {/* Print-only trip sheet — lives outside <main> so @media print can
          hide the whole on-screen dashboard and still render this sheet. */}
      {plan && <PrintableTrip plan={plan} />}

      {/* Ghumi Ghumi AI — floating right-side chat box (with suggestions),
          mounted once per trip instead of the old full-width section. */}
      {plan && !loading && <GhumiGhumiAI key={plan.destination} plan={plan} />}
    </div>
    </ErrorBoundary>
  );
}
