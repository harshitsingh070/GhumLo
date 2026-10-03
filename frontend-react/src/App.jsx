import { useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { go, navigate, useHashRoute } from "./lib/router.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import TripForm from "./components/TripForm.jsx";
import LoadingProgress from "./components/LoadingProgress.jsx";
import PickCard from "./components/PickCard.jsx";
import TripBudgetCard from "./components/TripBudgetCard.jsx";
import StickyBudgetSummary from "./components/StickyBudgetSummary.jsx";
import SectionSideNav from "./components/SectionSideNav.jsx";
import DestinationsPage from "./components/DestinationsPage.jsx";
import HowItWorksPage from "./components/HowItWorksPage.jsx";
import BudgetShowcase from "./components/BudgetShowcase.jsx";
import SampleTrip from "./components/SampleTrip.jsx";
import Benefits from "./components/Benefits.jsx";
import CtaSection from "./components/CtaSection.jsx";
import About from "./components/About.jsx";
import Footer from "./components/Footer.jsx";
import SavingsSuggestions from "./components/SavingsSuggestions.jsx";
import ItinerarySection from "./components/ItinerarySection.jsx";
import WeatherSnapshot from "./components/WeatherSnapshot.jsx";
import ExchangeRateNote from "./components/ExchangeRateNote.jsx";
import EventsSection from "./components/EventsSection.jsx";
import PopularPlaces from "./components/PopularPlaces.jsx";
import SmartOptions from "./components/SmartOptions.jsx";
import GhumiGhumiAI from "./components/GhumiGhumiAI.jsx";
import KnowBeforeYouGo from "./components/KnowBeforeYouGo.jsx";
import DestinationVlogs from "./components/DestinationVlogs.jsx";
import PrintableTrip from "./components/PrintableTrip.jsx";

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
  // Destination-card prefill: sets the form's destination field (everything
  // else the user typed is untouched), returns to the home page when called
  // from the Destinations page, and scrolls the form into view.
  const [prefillDestination, setPrefillDestination] = useState("");
  const route = useHashRoute();
  const pickDestination = (name) => {
    if (!name) return;
    setPrefillDestination(name);
    if (route !== "home") {
      navigate("home");
      setTimeout(
        () => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }),
        150
      );
    } else {
      document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const postPlan = async (payload) => {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  };

  const handleSubmit = async (payload) => {
    const id = ++reqIdRef.current;
    lastPayloadRef.current = payload;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      // Fresh trip: auto-selection path (no selected_hotel_name), so any
      // previous hotel choice resets by construction — the new response
      // carries selected_hotel_name: null and the picker highlights the
      // new auto pick.
      const data = await postPlan(payload);
      if (reqIdRef.current === id) setPlan(data);
    } catch (err) {
      if (reqIdRef.current === id) setError(err.message);
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
      const data = await postPlan({
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
      // working results; surface the message above them.
      if (reqIdRef.current === id) setError(err.message);
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
      const data = await postPlan({ ...base, travel_mode: option.mode, selected_hotel_name: null });
      if (reqIdRef.current === id) {
        lastPayloadRef.current = { ...base, travel_mode: data.travel_mode ?? option.mode, selected_hotel_name: null };
        setPlan(data);
      }
    } catch (err) {
      if (reqIdRef.current === id) setError(err.message);
    } finally {
      if (reqIdRef.current === id) setRecomputing(false);
    }
  };

  const handleDemo = async () => {
    const id = ++reqIdRef.current;
    setDemoLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch("/api/demo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo unavailable.");
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
        setTimeout(
          () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      }
    } catch (err) {
      if (reqIdRef.current === id) setError(err.message);
    } finally {
      if (reqIdRef.current === id) setDemoLoading(false);
    }
  };

  const showingResults = !!plan || loading || !!error;

  /* Single reconciled budget state for the whole results dashboard.
   *  The strip, the overview "why this fits" reasons, and the budget gauge
   *  all render from these numbers, so a stale backend `remaining_budget`
   *  can never make one card disagree with the other two. The displayed
   *  total and cap are the source of truth: over = total > cap. */
  const reconciled = (() => {
    const total = Number(plan?.best_pick?.total_cost) || 0;
    const cap = Number(plan?.budget) || 0;
    const over = cap > 0 ? total > cap : !plan?.fits_budget;
    const diff = cap > 0 ? Math.abs(total - cap) : Math.abs(Number(plan?.remaining_budget) || 0);
    return { total, cap, over, diff };
  })();

  return (
    <div
      className="min-h-screen font-sans text-slate-100"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <Header />
      {route === "home" && (
        <Hero
          plan={plan}
          onViewPlan={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}
        />
      )}

      <main
        className={`tcc-container space-y-12 pb-24 sm:space-y-16 ${
          route === "home" ? "pt-4 sm:pt-6" : "pt-[104px]"
        }`}
      >
        {route === "destinations" && <DestinationsPage onPick={pickDestination} />}
        {route === "how" && <HowItWorksPage />}

        {route === "home" && (
          <>
            {/* ── Planner (overlaps the hero) ── */}
            <div id="plan" className="relative z-20 -mt-28 scroll-mt-28 sm:-mt-32">
              <TripForm
                loading={loading}
                onSubmit={handleSubmit}
                prefillDestination={prefillDestination}
                onDemo={handleDemo}
                demoLoading={demoLoading}
              />
            </div>

            {/* ── Loading ── */}
            {loading && <LoadingProgress />}

            {/* ── Error / empty ── */}
            {error && !loading && (
              <section
                className="animate-fade-rise glass-panel rounded-[24px] p-8 text-center text-white"
                style={{
                  background: "rgba(9, 38, 48, 0.92)",
                  border: "1px solid rgba(255, 114, 94, 0.3)",
                }}
                role="alert"
                aria-label="No trips found"
              >
                <span
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255, 114, 94, 0.15)", color: "var(--coral)" }}
                >
                  <SearchX className="h-7 w-7" />
                </span>
                <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-white">
                  {lastPayloadRef.current?.budget
                    ? `No trips found within ₹${Number(lastPayloadRef.current.budget).toLocaleString("en-IN")}`
                    : "We couldn't build that trip"}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-300">
                  {error}
                </p>
                <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-[14px] text-slate-300">
                  <li>· Try increasing your budget</li>
                  <li>· Try changing your travel dates</li>
                  <li>· Try a nearby alternate airport or destination</li>
                </ul>
                <a
                  href="#plan"
                  onClick={(e) => {
                    e.preventDefault();
                    go("home", "plan");
                  }}
                  className="btn-primary mt-6 inline-flex h-[46px] items-center rounded-xl px-7 text-[14px] font-bold"
                >
                  Adjust search
                </a>
              </section>
            )}

            {/* ── Results Dashboard ── */}
            {plan && !loading && (
              <div className="space-y-8 xl:space-y-10 animate-fade-rise">
                {/* Compact trip status (identity + budget state + print).
                    Budget numbers flow from the single reconciled state above
                    so the strip, overview reasons, and gauge can never disagree. */}
                <StickyBudgetSummary
                  plan={plan}
                  total_cost={reconciled.total}
                  budget={reconciled.cap}
                  fits_budget={!reconciled.over}
                />

                {/* In-page section rail (desktop ≥1440px icon dock; not a
                    second navbar — the primary Header is untouched). */}
                <SectionSideNav plan={plan} />

                {/* ── MAIN DASHBOARD ── */}
                <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.8fr)_minmax(250px,0.85fr)] xl:gap-7">
                  {/* Trip Overview — natural height; never stretched */}
                  <div className="md:order-2 xl:order-1">
                    <PickCard
                      best_pick={plan.best_pick}
                      fits_budget={!reconciled.over}
                      remaining_budget={reconciled.over ? plan.remaining_budget : reconciled.diff}
                      budget={reconciled.cap}
                      num_nights={plan.num_nights}
                      live_search={plan.live_search}
                      insight={plan.insight}
                      destination={plan.destination}
                      departure_date={plan.departure_date}
                      return_date={plan.return_date}
                      travelers={plan.travelers}
                      itinerary={plan.itinerary}
                      hotel_options={plan.hotel_options}
                      selected_hotel_name={plan.selected_hotel_name}
                      onSelectHotel={selectHotel}
                      recomputing={recomputing}
                    />
                  </div>

                  {/* Unified Itinerary + Map — full row on tablet for max width */}
                  <div className="md:order-1 md:col-span-2 xl:order-2 xl:col-span-1">
                    <ItinerarySection
                      itinerary={plan.itinerary}
                      num_nights={plan.num_nights}
                      hotel={plan.best_pick.hotel}
                      destination={plan.destination}
                      flight={plan.best_pick.flight}
                      departure_date={plan.departure_date}
                    />
                  </div>

                  {/* Trip Budget Gauge — natural height, content top-aligned */}
                  <div className="md:order-3 xl:order-3">
                    <TripBudgetCard
                      flight_price={plan.best_pick.flight.price}
                      hotel_total={plan.best_pick.hotel.total_price}
                      total_cost={reconciled.total}
                      budget={reconciled.cap}
                      fits_budget={!reconciled.over}
                      flight_airline={plan.best_pick.flight.airline}
                      hotel_nights={plan.num_nights}
                      onViewFullPlan={() => document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth" })}
                    />
                  </div>
                </div>

                {/* ── Popular Experiences (full width) ── */}
                <PopularPlaces places={plan.places} destination={plan.destination} />

                {/* ── Contextual Deep-Dive Sections ── */}
                <div className="space-y-8 xl:space-y-10">
                  {/* Cost Optimization */}
                  <SavingsSuggestions suggestions={plan.suggestions} />

                  {/* Alternative travel styles + what-if budget */}
                  <SmartOptions plan={plan} onSelectAlternative={selectAlternative} recomputing={recomputing} />

                  {/* Weather + currency (compact pair) */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-6">
                    <WeatherSnapshot weather={plan.weather} destination={plan.destination} />
                    <ExchangeRateNote exchange_rate={plan.exchange_rate} budget={plan.budget} />
                  </div>

                  {/* Good to Know + Local events (compact pair) */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:gap-6">
                    <KnowBeforeYouGo know={plan.know} destination={plan.destination} />
                    <EventsSection events={plan.events} destination={plan.destination} />
                  </div>

                  {/* Destination YouTube Vlogs */}
                  <DestinationVlogs videos={plan.videos} destination={plan.destination} />
                </div>
              </div>
            )}

            {/* ── Landing story (hidden while results/loading/error show).
                Popular Destinations and How It Works live on their own pages. */}
            {!showingResults && (
              <>
                <BudgetShowcase />
                <SampleTrip />
                <Benefits />
              </>
            )}

            {/* ── Always available ── */}
            {plan && !loading && <Benefits />}
            <About />
            {!showingResults && <CtaSection />}
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
  );
}
