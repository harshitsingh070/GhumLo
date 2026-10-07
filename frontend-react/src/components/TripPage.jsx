import { go } from "../lib/router.js";
import LoadingProgress from "./LoadingProgress.jsx";
import ErrorState from "./ErrorState.jsx";
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
}) {
  const total = Number(plan?.best_pick?.total_cost) || 0;
  const cap = Number(plan?.budget) || 0;
  const over = cap > 0 ? total > cap : !plan?.fits_budget;
  const diff = cap > 0 ? Math.abs(total - cap) : Math.abs(Number(plan?.remaining_budget) || 0);

  return (
    <div className="tcc-page relative z-20 -mt-28 space-y-8 scroll-mt-28 sm:-mt-32 xl:space-y-10">
      {/* Loading */}
      {loading && <LoadingProgress />}

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

          {/* MAIN DASHBOARD */}
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.8fr)] xl:gap-7">
            <div className="md:order-2 xl:order-1">
              <PickCard
                best_pick={plan.best_pick}
                fits_budget={!over}
                remaining_budget={over ? plan.remaining_budget : diff}
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
