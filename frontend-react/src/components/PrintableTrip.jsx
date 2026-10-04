/** Print-only travel voucher: full trip sheet for Print / Save-as-PDF.
 *  Screen: display:none. Print: A4 voucher with header, cost table,
 *  flight+hotel cards, day-wise sheets, good-to-know and terms.
 *  Pure presentation of the live plan — no invented data. */
import { formatStops } from "../lib/format.js";

const inr = (n) => `\u20B9${Number(n || 0).toLocaleString("en-IN")}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function addDaysISO(iso, n) {
  const p = parseISO(iso);
  if (!p) return "";
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function fmtLong(iso) {
  const p = parseISO(iso);
  if (!p) return String(iso || "");
  const wd = WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()];
  return `${wd}, ${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

function fmtShort(iso) {
  const p = parseISO(iso);
  if (!p) return String(iso || "");
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

function bookingRef(plan) {
  const dest = String(plan?.destination || "TRIP").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TRP";
  const date = String(plan?.departure_date || "").replace(/-/g, "").slice(2) || "000000";
  let h = 0;
  const seed = `${plan?.origin}|${plan?.destination}|${plan?.departure_date}|${plan?.budget}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `GL-${dest}-${date}-${String(h % 9000 + 1000)}`;
}

function airportStr(node) {
  if (!node || typeof node !== "object") return "";
  const id = node.id || node.code || "";
  const tm = node.time || "";
  const nm = node.name || "";
  if (id && tm) return `${id} · ${tm}`;
  if (id) return String(id);
  if (nm) return String(nm);
  return "";
}

export default function PrintableTrip({ plan }) {
  if (!plan) return null;
  const days = Array.isArray(plan.itinerary) ? plan.itinerary : [];
  const best = plan.best_pick || {};
  const flight = best.flight || {};
  const hotel = best.hotel || {};
  const travelers = Number(plan.travelers) || 1;
  const nights = Number(plan.num_nights) || Math.max(1, days.length);
  const total = Number(best.total_cost) || 0;
  const budget = Number(plan.budget) || 0;
  const fits = !!plan.fits_budget;
  const diff = fits
    ? Number(plan.remaining_budget) || Math.max(0, budget - total)
    : Number(best.over_by) || Math.max(0, total - budget);
  const perPersonFlight = flight.price_per_person ?? (travelers > 0 ? Math.round(Number(flight.price || 0) / travelers) : null);
  const generatedOn = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const ref = bookingRef(plan);
  const suggestions = Array.isArray(plan.suggestions) ? plan.suggestions : [];
  const events = Array.isArray(plan.events) ? plan.events.slice(0, 6) : [];
  const know = Array.isArray(plan.know) ? plan.know.slice(0, 5) : [];
  const weather = plan.weather || null;
  const fx = plan.exchange_rate || null;
  const packing = plan.packing && Array.isArray(plan.packing.groups) ? plan.packing : null;
  const stopsTotal = days.reduce((a, d) => a + (Array.isArray(d.places) ? d.places.length : 0), 0);

  return (
    <div className="print-only" aria-hidden="true">
      {/* ── Voucher header ── */}
      <div className="pt-header">
        <div>
          <div className="pt-brand">GhoomLo · Travel Itinerary Cum Voucher</div>
          <div className="pt-title">
            {plan.origin || ""} → {plan.destination || "Trip"} · {fmtShort(plan.departure_date)} – {fmtShort(plan.return_date)}
          </div>
          <div className="pt-sub">
            Booking Ref {ref} · Generated {generatedOn} · {plan.live_search ? "Live SerpApi prices" : "Cached prices"} · {plan.travel_mode ? `${String(plan.travel_mode).toUpperCase()} mode` : ""}
          </div>
        </div>
        <div className={`pt-status ${fits ? "ok" : "over"}`}>
          {fits ? `WITHIN BUDGET · ${inr(diff)} left` : `OVER BUDGET · ${inr(diff)} over`}
        </div>
      </div>

      {/* ── Traveller / trip summary ── */}
      <table className="pt-grid">
        <tbody>
          <tr>
            <td><span>Route</span><strong>{plan.origin || "—"} → {plan.destination || "—"}</strong></td>
            <td><span>Travel dates</span><strong>{fmtLong(plan.departure_date)} → {fmtLong(plan.return_date)}</strong></td>
          </tr>
          <tr>
            <td><span>Travellers · Nights · Stops</span><strong>{travelers} traveller{travelers !== 1 ? "s" : ""} · {nights} night{nights !== 1 ? "s" : ""} · {days.length} day{days.length !== 1 ? "s" : ""} · {stopsTotal} stops</strong></td>
            <td><span>Budget vs total</span><strong>Budget {inr(budget)} · Total {inr(total)}</strong></td>
          </tr>
        </tbody>
      </table>

      {plan.insight && <p className="pt-insight">{plan.insight}</p>}

      {/* ── Cost breakdown (travel-desk style) ── */}
      <h2 className="pt-h2">Cost breakdown</h2>
      <table className="pt-table">
        <thead>
          <tr><th>Item</th><th>Detail</th><th className="r">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Flights ({flight.airline || "—"})</td>
            <td>{flight.duration || "—"} · {formatStops(flight.stops) || "—"}{travelers > 1 && perPersonFlight != null ? ` · ${inr(perPersonFlight)} × ${travelers}` : ""}</td>
            <td className="r">{inr(flight.price)}</td>
          </tr>
          <tr>
            <td>Hotel ({hotel.name || "—"})</td>
            <td>{hotel.rating ? `${hotel.rating}★ · ` : ""}{inr(hotel.price_per_night)} × {nights} night{nights !== 1 ? "s" : ""}{travelers > 1 ? ` · ${travelers} guests` : ""}</td>
            <td className="r">{inr(hotel.total_price)}</td>
          </tr>
          <tr className="total">
            <td colSpan={2}>Trip total{budget ? ` (${Math.round((total / budget) * 100)}% of budget)` : ""}</td>
            <td className="r">{inr(total)}</td>
          </tr>
          <tr>
            <td colSpan={2}>{fits ? "Balance left from budget" : "Amount over budget"}</td>
            <td className="r">{inr(diff)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Flight + hotel confirm boxes ── */}
      <h2 className="pt-h2">Bookings</h2>
      <table className="pt-grid">
        <tbody>
          <tr>
            <td>
              <span>✈ Flight — {flight.airline || "—"}</span>
              <strong>{formatStops(flight.stops) || ""}{flight.duration ? ` · ${flight.duration}` : ""}</strong>
              {airportStr(flight.departure) && <div className="pt-small">Depart: {airportStr(flight.departure)}</div>}
              {airportStr(flight.arrival) && <div className="pt-small">Arrive: {airportStr(flight.arrival)}</div>}
              <div className="pt-small">Total {inr(flight.price)}{perPersonFlight != null && travelers > 1 ? ` (${inr(perPersonFlight)} per person)` : ""} · Reconfirm timings with the airline a day before.</div>
            </td>
            <td>
              <span>🏨 Hotel — {hotel.name || "—"}</span>
              <strong>{hotel.rating ? `${hotel.rating}★ · ` : ""}Check-in {fmtShort(plan.departure_date)} → Check-out {fmtShort(plan.return_date)}</strong>
              <div className="pt-small">{inr(hotel.price_per_night)}/night × {nights} = {inr(hotel.total_price)} · Carry a valid Govt ID at check-in.</div>
              {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
                <div className="pt-small">Amenities: {hotel.amenities.slice(0, 6).join(" · ")}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Day-wise programme ── */}
      <h2 className="pt-h2">Day-wise programme</h2>
      {days.map((d) => {
        const iso = addDaysISO(plan.departure_date, Number(d.day || 1) - 1);
        const places = Array.isArray(d.places) ? d.places : [];
        return (
          <div key={d.day} className="pt-day">
            <div className="pt-dayhead">
              <strong>Day {d.day} — {fmtLong(iso)}</strong>
              <span>{places.length} stop{places.length !== 1 ? "s" : ""}{d.distance_km ? ` · ~${d.distance_km} km between stops` : ""}</span>
            </div>
            {places.length === 0 ? (
              <div className="pt-small">Free day — at leisure. Optional: rest at hotel or explore nearby markets.</div>
            ) : (
              <table className="pt-table">
                <thead>
                  <tr><th style={{ width: 32 }}>#</th><th>Stop</th><th style={{ width: 92 }}>Type</th><th style={{ width: 64 }}>Rating</th></tr>
                </thead>
                <tbody>
                  {places.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{p.name || `Stop ${i + 1}`}</strong>
                        {p.address ? <div className="pt-small">{p.address}</div> : null}
                      </td>
                      <td>{String(p.category || "").toLowerCase().startsWith("rest") ? "Meal" : "Sightseeing"}</td>
                      <td>{p.rating ? `${p.rating}★` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {Number(d.day) === 1 && (
              <div className="pt-small">Day 1 note: land → hotel check-in → easy sightseeing only; keep it light after the flight.</div>
            )}
            {Number(d.day) === days.length && days.length > 1 && (
              <div className="pt-small">Last-day note: keep baggage ready, check out on time, reach airport 2–3 hrs before departure.</div>
            )}
          </div>
        );
      })}

      {/* ── Good to know ── */}
      <h2 className="pt-h2">Good to know</h2>
      <table className="pt-grid">
        <tbody>
          <tr>
            <td>
              <span>Current conditions at {plan.destination || "destination"}</span>
              {weather ? (
                <div className="pt-small">
                  {weather.temperature ? `${weather.temperature}°${weather.unit ? String(weather.unit).slice(0, 1) : "C"}` : ""}{weather.condition ? ` · ${weather.condition}` : ""}
                  {weather.humidity ? ` · Humidity ${weather.humidity}` : ""}{weather.wind ? ` · Wind ${weather.wind}` : ""}
                  {weather.precipitation ? ` · Rain ${weather.precipitation}` : ""} (observed now, not a forecast for your dates — recheck before packing).
                </div>
              ) : (
                <div className="pt-small">Check the forecast a day before departure and pack accordingly.</div>
              )}
              {fx && fx.rate ? (
                <div className="pt-small">Money: 1 {fx.from_currency} ≈ {fx.rate} {fx.to_currency} at plan time — rates move; carry a forex card + some cash.</div>
              ) : null}
            </td>
            <td>
              <span>Carry / follow</span>
              <div className="pt-small">IDs for all travellers · hotel voucher + this sheet (PDF on phone is fine) · medicines, chargers, light jacket · confirm flight PNR &amp; hotel 24 hrs prior.</div>
              {!fits && suggestions.length > 0 && (
                <div className="pt-small">Over-budget options: {suggestions.map((s) => s.message).join(" ")}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {events.length > 0 && (
        <>
          <h2 className="pt-h2">Happening around your dates</h2>
          <ul className="pt-list">
            {events.map((e, i) => (
              <li key={i}><strong>{e.title}</strong>{e.date ? ` — ${e.date}` : ""}{e.venue ? ` · ${e.venue}` : ""}{e.description ? `. ${e.description}` : ""}</li>
            ))}
          </ul>
        </>
      )}

      {packing && (
        <>
          <h2 className="pt-h2">Packing checklist — weather-aware</h2>
          {packing.summary && <p className="pt-small"><strong>{packing.summary}</strong></p>}
          {(packing.groups || []).map((g) => (
            <div key={g.title} style={{ marginTop: 6 }}>
              <div className="pt-small"><strong>{g.title}</strong></div>
              <ul className="pt-list">
                {(g.items || []).map((it, i) => (
                  <li key={i}>☐ {it.item}{it.why ? ` — ${it.why}` : ""}</li>
                ))}
              </ul>
            </div>
          ))}
          {packing.note && <div className="pt-small">{packing.note}</div>}
        </>
      )}

      {know.length > 0 && (
        <>
          <h2 className="pt-h2">Know before you go — sources</h2>
          <ul className="pt-list">
            {know.map((k, i) => (
              <li key={i}><strong>{k.title}</strong>{k.snippet ? ` — ${k.snippet}` : ""} ({k.link})</li>
            ))}
          </ul>
        </>
      )}

      <div className="pt-terms">
        Terms: flight/hotel prices were live at generation and can change till ticketed · entry tickets, meals not in room plan, and local transport are extra unless listed above · distances are straight-line estimates for grouping, follow driver/maps on road · verify visa, ID and airline rules before travel.
      </div>
      <p className="pt-foot">GhoomLo travel sheet · Ref {ref} · {plan.origin} → {plan.destination} · {fmtShort(plan.departure_date)} – {fmtShort(plan.return_date)} · Page generated {generatedOn}</p>
    </div>
  );
}
