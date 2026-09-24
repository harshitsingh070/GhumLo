import { useEffect, useState } from "react";
import ItineraryDay from "./ItineraryDay.jsx";
import ItineraryMap from "./ItineraryMap.jsx";

/** Tabbed day navigation. Pure selection state over the unchanged itinerary
 *  array — defaults to Day 1, resets when a new plan arrives. */
export default function ItinerarySection({ itinerary, num_nights, counts, hotel, destination }) {
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    setActiveDay(1);
  }, [itinerary]);

  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;
  const active = itinerary.find((d) => d.day === activeDay) ?? itinerary[0];

  return (
    <section
      id="itinerary"
      aria-label="Day-by-day itinerary"
      className="scroll-mt-24 rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
        Day-by-day itinerary ({num_nights} day(s))
      </h2>
      <p className="mb-4 mt-1 text-sm text-smoke dark:text-white/55">
        Checked {counts.flights} flights × {counts.hotels} hotels · {counts.attractions} attractions ·{" "}
        {counts.restaurants} restaurants
      </p>
      <ItineraryMap hotel={hotel} itinerary={itinerary} activeDay={active.day} destination={destination} onSelectDay={setActiveDay} />
      <div className="mb-1 mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Trip days">
        {itinerary.map((d) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={d.day === active.day}
            onClick={() => setActiveDay(d.day)}
            className={`tcc-focus rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              d.day === active.day
                ? "bg-ink text-white shadow dark:bg-white dark:text-ink"
                : "border border-line bg-white text-smoke hover:border-ink/30 hover:text-ink dark:border-white/15 dark:bg-transparent dark:text-white/65 dark:hover:text-white"
            }`}
          >
            Day {d.day}
          </button>
        ))}
      </div>
      {!!active.distance_km && (
        <p className="mb-2 mt-2 text-sm text-smoke dark:text-white/55">
          ~{Number(active.distance_km)} km between stops
        </p>
      )}
      <ItineraryDay day={active} />
    </section>
  );
}
