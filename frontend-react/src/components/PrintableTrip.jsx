/** Print-only full trip sheet: all days listed sequentially.
 *  Screen readers/seeing users see the tabbed itinerary; this div is
 *  display:none on screen and display:block in @media print only. */
export default function PrintableTrip({ plan }) {
  if (!plan) return null;
  const days = Array.isArray(plan.itinerary) ? plan.itinerary : [];
  const best = plan.best_pick || {};
  const flight = best.flight || {};
  const hotel = best.hotel || {};
  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="print-only" aria-hidden="true">
      <h1>GhoomLo — {plan.destination} trip plan</h1>
      <p>
        {plan.departure_date} → {plan.return_date} · {plan.travelers} traveler(s) · Budget{" "}
        {fmt(plan.budget)} · Total {fmt(best.total_cost)} (
        {plan.fits_budget ? "within budget" : "over budget"})
      </p>
      <p>
        Flight: {flight.airline} ({flight.duration}, {flight.stops} stop(s)) — {fmt(flight.price)}.
        Hotel: {hotel.name} ({hotel.rating}★, {fmt(hotel.price_per_night)}/night ×{" "}
        {plan.num_nights}) — {fmt(hotel.total_price)}.
      </p>
      {plan.insight && <p>{plan.insight}</p>}
      {days.map((d) => (
        <div key={d.day} style={{ marginTop: 12 }}>
          <h2>
            Day {d.day}
            {d.distance_km ? ` — ~${d.distance_km} km between stops` : ""}
          </h2>
          <ul>
            {(d.places || []).map((p, i) => (
              <li key={i}>
                {p.name}
                {p.rating ? ` (${p.rating}★)` : ""} — {p.category}
                {p.address ? ` · ${p.address}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {Array.isArray(plan.know) && plan.know.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h2>Know before you go</h2>
          <ul>
            {plan.know.map((k, i) => (
              <li key={i}>
                {k.title} — {k.link}
                {k.snippet ? ` · ${k.snippet}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p style={{ marginTop: 12 }}>Generated with live SerpApi data · GhoomLo</p>
    </div>
  );
}
