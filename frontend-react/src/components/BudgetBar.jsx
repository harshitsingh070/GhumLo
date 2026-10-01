import { Hotel, Plane } from "lucide-react";
import { inr } from "../lib/format.js";

/** Itemized cost breakdown: flight/hotel rows with share-of-total, a
 *  separated Total row, and a slim stacked bar. Same props as before.
 *  Props: flight_price, hotel_total, total_cost, budget, fits_budget. */
export default function BudgetBar({ flight_price, hotel_total, total_cost, budget, fits_budget }) {
  const flight = Number(flight_price) || 0;
  const hotel = Number(hotel_total) || 0;
  const total = Number(total_cost) || flight + hotel;
  const flightShare = total > 0 ? Math.round((flight / total) * 100) : 0;
  const hotelShare = total > 0 ? 100 - flightShare : 0; // remainder: shares always sum to 100

  return (
    <section
      id="budget"
      className="rounded-[18px] border border-line bg-white p-6 shadow-card sm:p-7 dark:border-white/10 dark:bg-ink"
      aria-label="Cost breakdown"
    >
      <h2 className="font-display text-xl font-extrabold tracking-tight text-ink dark:text-white">
        Cost breakdown
      </h2>
      <ul className="mt-4 space-y-2.5 text-[15px]">
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay/10 text-clay">
              <Plane className="h-4 w-4" />
            </span>
            <span className="font-medium text-ink dark:text-white">Flight</span>
            <span className="text-sm text-smoke dark:text-white/55">{flightShare}% of total</span>
          </span>
          <strong className="whitespace-nowrap text-ink dark:text-white">{inr(flight)}</strong>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-ink dark:bg-white/10 dark:text-white">
              <Hotel className="h-4 w-4" />
            </span>
            <span className="font-medium text-ink dark:text-white">Hotel</span>
            <span className="text-sm text-smoke dark:text-white/55">{hotelShare}% of total</span>
          </span>
          <strong className="whitespace-nowrap text-ink dark:text-white">{inr(hotel)}</strong>
        </li>
      </ul>
      <div
        className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-sand dark:bg-white/10"
        role="img"
        aria-label={`Flight ${flightShare} percent, hotel ${hotelShare} percent of total cost`}
      >
        <div className="bg-clay" style={{ width: `${flightShare}%` }} />
        <div className="bg-pine" style={{ width: `${hotelShare}%` }} />
      </div>
    </section>
  );
}
