import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { go } from "../lib/router.js";
import LoadingProgress from "./LoadingProgress.jsx";
import ErrorState from "./ErrorState.jsx";
import { budgetFromPlan } from "../lib/budget.js";
import { inr } from "../lib/format.js";
import { InlineThinking } from "./Loader.jsx";
import PickCard from "./PickCard.jsx";
import StickyBudgetSummary from "./StickyBudgetSummary.jsx";
import ItinerarySection from "./ItinerarySection.jsx";
import WeatherSnapshot from "./WeatherSnapshot.jsx";
import PackingList from "./PackingList.jsx";
import ExchangeRateNote from "./ExchangeRateNote.jsx";
import EventsSection from "./EventsSection.jsx";
import PopularPlaces from "./PopularPlaces.jsx";
import SmartOptions from "./SmartOptions.jsx";
import KnowBeforeYouGo from "./KnowBeforeYouGo.jsx";
import DestinationVlogs from "./DestinationVlogs.jsx";
import SavingsSuggestions from "./SavingsSuggestions.jsx";

/** Dedicated Plan Trip page — full trip details dashboard.
 *  The builder form lives only on Explore; submitting there loads
 *  everything then lands here under the full-screen TripHero. */
export default function TripPage({
  plan,
  loading,
  recomputing,
  error,
  lastBudget,
  onSelectHotel,
  onSelectAlternative,
  onCancel,
}) {
  // Single source of truth — all children derive from this state object.
  const budget = budgetFromPlan(plan || {});
  const { total, cap, over } = budget;
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const saveTrip = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghoomlo-trip-${plan.destination || "plan"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const shareTrip = async () => {
    if (!plan) return;
    const text = `${plan.destination} trip ${plan.departure_date} to ${plan.return_date}\n${inr(total)} total / ${inr(cap)} budget\n${plan.best_pick?.flight?.airline || "Flight"} + ${plan.best_pick?.hotel?.name || "Hotel"}\n${(plan.itinerary || []).length}-day itinerary via GhoomLo`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${plan.destination} trip plan`, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(false);
    }
  };

  return (
    <div className="tcc-page relative z-20 -mt-16 space-y-8 scroll-mt-28 sm:-mt-24 xl:space-y-10">
      {/* Loading */}
      {loading && <LoadingProgress onCancel={onCancel} />}

      {/* Error */}
      {error && !loading && (
        <ErrorState
          icon="search"
          title={
            lastBudget
              ? `No trips found within ₹${Number(lastBudget).toLocaleString("en-IN")}`
              : "We couldn't build that trip"
          }
          message={error}
          suggestions={[
            "Try increasing your budget",
            "Try changing your travel dates",
            "Try a nearby alternate airport or destination",
          ]}
          actionLabel="Adjust search"
          onAction={() => go("home", "plan")}
        />
      )}

      {/* Empty state — first visit, no search yet */}
      {!plan && !loading && !error && (
        <section
          className="rounded-[24px] bg-white p-8 text-center"
          style={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
          }}
        >
          <p className="t-body text-[#52606D]">
            No trip yet — build one on the{" "}
            <button
              type="button"
              onClick={() => go("home", "plan")}
              className="font-bold text-[#FF6B57] underline underline-offset-2 hover:text-[#F25542]"
            >
              Explore page
            </button>{" "}
            and your full plan with flights, hotel, itinerary, budget and guides will appear here.
          </p>
        </section>
      )}

      {/* Results Dashboard — all trip details on this page */}
      {plan && !loading && (
        <div id="results" className="space-y-8 xl:space-y-10 animate-fade-rise scroll-mt-28">
          {/* Recompute progress — hotel/style swap running, old plan kept */}
          {recomputing && (
            <div
              className="flex items-center gap-3 rounded-[16px] bg-white px-5 py-3.5"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
              }}
              aria-live="polite"
            >
              <InlineThinking label="Updating your trip with fresh prices…" />
            </div>
          )}
          <StickyBudgetSummary
            plan={plan}
            total_cost={total}
            budget={cap}
            fits_budget={!over}
          />

          {/* Persistent next actions — only supported actions (Save/Share).
              No fake booking. Share carries the real trip summary, not an
              opaque hash that cannot restore the plan. */}
          <div className="flex flex-wrap gap-2.5" role="group" aria-label="Trip actions">
            <button
              type="button"
              onClick={saveTrip}
              className="tcc-focus tcc-touch inline-flex items-center gap-2 rounded-xl px-5 t-btn"
              style={{ background: "var(--color-brand)", color: "#FFFFFF" }}
            >
              {saved ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {saved ? "Saved" : "Save trip"}
            </button>
            <button
              type="button"
              onClick={shareTrip}
              className="tcc-focus tcc-touch inline-flex items-center gap-2 rounded-xl px-5 t-btn"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#102A43" }}
            >
              {shared ? <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} /> : <Share2 className="h-4 w-4" />}
              {shared ? "Shared" : "Share"}
            </button>
          </div>

          {/* MAIN DASHBOARD */}
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.8fr)] xl:gap-7">
            <div className="md:order-2 xl:order-1">
              <PickCard
                best_pick={plan.best_pick}
                fits_budget={!over}
                remaining_budget={budget.remaining}
                budget={cap}
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
                onSelectHotel={onSelectHotel}
                recomputing={recomputing}
              />
            </div>

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
          </div>

          <PopularPlaces places={plan.places} destination={plan.destination} />

          <div className="space-y-8 xl:space-y-10">
            <SavingsSuggestions suggestions={plan.suggestions} />

            <SmartOptions plan={plan} onSelectAlternative={onSelectAlternative} recomputing={recomputing} />

            {/* Weather + Packing (left stack) + Guides + Good to know (right) */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 xl:gap-6">
              <div className="space-y-5">
                <WeatherSnapshot weather={plan.weather} destination={plan.destination} />
                <PackingList packing={plan.packing} weather={plan.weather} num_nights={plan.num_nights} destination={plan.destination} />
              </div>
              <div className="space-y-5">
                <DestinationVlogs videos={plan.videos} destination={plan.destination} />
                <KnowBeforeYouGo know={plan.know} destination={plan.destination} />
              </div>
            </div>

            <ExchangeRateNote exchange_rate={plan.exchange_rate} budget={plan.budget} />

            <EventsSection events={plan.events} destination={plan.destination} />
          </div>
        </div>
      )}
    </div>
  );
}
