import { useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { go, navigate, useHashRoute } from "./lib/router.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import TripForm from "./components/TripForm.jsx";
import LoadingProgress from "./components/LoadingProgress.jsx";
import PickCard from "./components/PickCard.jsx";
import BudgetBar from "./components/BudgetBar.jsx";
import StickyBudgetSummary from "./components/StickyBudgetSummary.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import DestinationsPage from "./components/DestinationsPage.jsx";
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
import AITripAssistant from "./components/AITripAssistant.jsx";
import ResultsNav from "./components/ResultsNav.jsx";
import KnowBeforeYouGo from "./components/KnowBeforeYouGo.jsx";
import DestinationVlogs from "./components/DestinationVlogs.jsx";
import PrintTripButton from "./components/PrintTripButton.jsx";
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
        // Seed last payload so hotel re-pick attempts the live endpoint
        // (fails gracefully with plan kept when no key is configured).
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

  return (
    <div className="min-h-screen bg-cream font-sans text-ink dark:bg-ink dark:text-white">
      <Header />
      {route === "home" && <Hero />}

      <main className="tcc-container space-y-12 pb-20 pt-12 sm:space-y-20 sm:pt-14">
        {route === "destinations" && <DestinationsPage onPick={pickDestination} />}

        {route === "home" && (
          <>
            {/* ── Planner ── */}
            <div id="plan" className="scroll-mt-24">
              <TripForm loading={loading} onSubmit={handleSubmit} prefillDestination={prefillDestination} onDemo={handleDemo} demoLoading={demoLoading} />
            </div>

        {/* ── Loading ── */}
        {loading && <LoadingProgress />}

        {/* ── Error / empty ── */}
        {error && !loading && (
          <section
              className="animate-fade-rise rounded-[20px] border border-line bg-white p-6 text-center shadow-card sm:p-10 dark:border-white/10 dark:bg-ink"
            role="alert"
            aria-label="No trips found"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clay/10 text-clay">
              <SearchX className="h-7 w-7" />
            </span>
            <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-ink dark:text-white">
              {lastPayloadRef.current?.budget
                ? `No trips found within ₹${Number(lastPayloadRef.current.budget).toLocaleString("en-IN")}`
                : "We couldn't build that trip"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-smoke dark:text-white/65">
              {error}
            </p>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-[15px] text-smoke dark:text-white/65">
              <li>· Try increasing your budget</li>
              <li>· Try changing your dates</li>
              <li>· Try a nearby destination</li>
            </ul>
            <a
              href="#plan"
              onClick={(e) => {
                e.preventDefault();
                go("home", "plan");
              }}
              className="tcc-focus mt-6 inline-flex h-[48px] items-center rounded-xl bg-clay px-7 text-[15px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-clay-dark hover:shadow"
            >
              Adjust search
            </a>
          </section>
        )}

        {/* ── Results ── */}
        {plan && !loading && (
          <div className="space-y-6">
            <StickyBudgetSummary
              total_cost={plan.best_pick.total_cost}
              budget={plan.budget}
              fits_budget={plan.fits_budget}
            />
            <ResultsNav />
            <div className="no-print flex flex-wrap gap-2">
              <PrintTripButton />
              {plan.demo && (
                <span className="inline-flex items-center rounded-full bg-sand px-3 py-1.5 text-xs font-bold text-ink/70 dark:bg-white/10 dark:text-white/70">
                  Demo data · no API key used
                </span>
              )}
            </div>
            <PickCard
              best_pick={plan.best_pick}
              fits_budget={plan.fits_budget}
              remaining_budget={plan.remaining_budget}
              budget={plan.budget}
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
            <AITripAssistant plan={plan} />
            <BudgetBar
              flight_price={plan.best_pick.flight.price}
              hotel_total={plan.best_pick.hotel.total_price}
              total_cost={plan.best_pick.total_cost}
              budget={plan.budget}
              fits_budget={plan.fits_budget}
            />
            <SmartOptions plan={plan} onSelectAlternative={selectAlternative} recomputing={recomputing} />
            {/* Optional extras — each component renders null when its field
                is absent (domestic trip / fetch failure), so the core flow
                never depends on them. */}
            <ExchangeRateNote exchange_rate={plan.exchange_rate} budget={plan.budget} />
            <SavingsSuggestions suggestions={plan.suggestions} />
            <WeatherSnapshot weather={plan.weather} destination={plan.destination} />
            <PopularPlaces places={plan.places} destination={plan.destination} />
            <ItinerarySection
              itinerary={plan.itinerary}
              num_nights={plan.num_nights}
              counts={plan.counts}
              hotel={plan.best_pick.hotel}
              destination={plan.destination}
            />
            <EventsSection events={plan.events} destination={plan.destination} />
            <KnowBeforeYouGo know={plan.know} destination={plan.destination} />
            <DestinationVlogs videos={plan.videos} destination={plan.destination} />
            <PrintableTrip plan={plan} />
          </div>
        )}

            {/* ── Landing story (hidden while results/loading/error show) ── */}
            {!showingResults && (
              <>
                <HowItWorks />
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
    </div>
  );
}
