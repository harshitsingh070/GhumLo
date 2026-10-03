import { useEffect, useState } from "react";
import {
  Plus,
  Plane,
  Hotel,
  Maximize2,
} from "lucide-react";
import ItineraryMap from "./ItineraryMap.jsx";
import SafeImage from "./SafeImage.jsx";
import { placeMapUrl } from "../lib/format.js";
import { CATEGORY_META } from "../lib/categories.js";
import { photoFor } from "../lib/destinations.js";

/** Exact-match placeholder names providers sometimes return — never shown raw. */
const JUNK_PLACE_NAMES = new Set(["somewhere", "unknown", "unnamed", "unnamed stop", "tbd", "test"]);

/** 3-letter all-caps codes ("DEL") read badly in sentences ("Arrive in DEL"). */
const isAirportCode = (s) => /^[A-Z]{3}$/.test(String(s ?? "").trim());

/** Friendly stop name: raw SerpApi name, or a category fallback for placeholders. */
function displayPlaceName(place, idx) {
  const raw = String(place?.name ?? "").trim();
  if (raw && !JUNK_PLACE_NAMES.has(raw.toLowerCase())) return place.name;
  return `${place?.category === "restaurants" ? "Local restaurant" : "Local attraction"} ${idx + 1}`;
}

/** Singular display label for the backend's plural category values. */
function categoryLabel(category) {
  const c = String(category || "").toLowerCase();
  if (c === "restaurants" || c === "restaurant") return "Restaurant";
  if (c === "attractions" || c === "attraction") return "Attraction";
  return "Attraction";
}

/** Add n days to a YYYY-MM-DD date (UTC math, no timezone drift). */
function addDaysISO(iso, n) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCDate(dt.getUTCDate() + n);
  const pad = (v) => String(v).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(`${iso}T12:00:00`);
  return `${weekdays[d.getDay()]}, ${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`;
};

/** Unified Itinerary + Map Module — Center column of 3-column dashboard.
 *  Inside:
 *    - Day picker chips (Day 1, Day 2, Day 3...) with dates & + Add activity
 *    - Day's activities (Arrival, Hotel Check-in, Attractions with thumbnails)
 *    - Interactive map preview with Expand button for the full map view. */
export default function ItinerarySection({
  itinerary,
  num_nights,
  hotel,
  destination,
  flight,
  departure_date,
  // Optional: notified whenever the open day changes. Uncontrolled
  // internally — behavior without it is identical.
  onActiveDayChange,
}) {
  /* Backend days carry no calendar date ({day, places, distance_km}), so the
   * real date is derived here: Day N = departure_date + (N - 1). Pure date
   * math on the plan's own dates — no invented data. */
  const dayDateISO = (d) =>
    d?.date || (departure_date ? addDaysISO(departure_date, Number(d?.day || 1) - 1) : "");
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedStop, setSelectedStop] = useState(null);
  const [customActivities, setCustomActivities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityTime, setNewActivityTime] = useState("");

  useEffect(() => {
    setActiveDay(1);
    setSelectedStop(null);
    onActiveDayChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary]);

  if (!Array.isArray(itinerary) || itinerary.length === 0) return null;
  const active = itinerary.find((d) => d.day === activeDay) ?? itinerary[0];
  const isFirstDay = active.day === 1;
  const isLastDay = active.day === itinerary.length;

  /* Compact route timeline: every row is a node in visit order, so sequence
   * numbers run arrival → hotel → stops → custom → depart without gaps. */
  const dayCustoms = customActivities.filter((a) => a.day === activeDay);
  const leadNodes = (isFirstDay ? 1 : 0) + (isFirstDay && hotel ? 1 : 0);
  const stopCount = Array.isArray(active.places) ? active.places.length : 0;
  const nodeCount = leadNodes + stopCount + dayCustoms.length + (isLastDay ? 1 : 0);

  const selectDay = (day) => {
    setActiveDay(day);
    setSelectedStop(null);
    onActiveDayChange?.(day);
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;
    setCustomActivities((prev) => [
      ...prev,
      {
        day: activeDay,
        name: newActivityName.trim(),
        time: newActivityTime.trim() || "Afternoon",
        category: "attraction",
      },
    ]);
    setNewActivityName("");
    setNewActivityTime("");
    setShowAddModal(false);
  };

  return (
    <section
      id="itinerary"
      aria-label="Day-by-day itinerary and interactive map"
      className="glass-panel scroll-mt-24 flex flex-col overflow-hidden rounded-[24px]"
      style={{
        background: "rgba(9, 38, 48, 0.88)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      {/* Trip scope meta — day/night scope only. Raw fetch `counts` are
          internal API stats, not itinerary content, so they stay out of this
          header (they remain available in the plan response for debugging). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.06] px-4 py-2">
        <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Day-by-day itinerary · {itinerary.length} day{itinerary.length === 1 ? "" : "s"}
        </span>
        {num_nights != null && (
          <span className="text-[11px] text-slate-500">
            {num_nights} night{Number(num_nights) === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* ── Itinerary (Days → Activities → Map, stacked) ── */}
      {activeTab === "itinerary" && (
        <div className="flex flex-col">
          {/* 1. Day selector — horizontal chip row on all breakpoints, so the
              activities list and the map each get the full column width. */}
          <div
            className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] p-3"
            style={{ scrollbarWidth: "none" }}
            role="tablist"
            aria-label="Itinerary days"
          >
              {itinerary.map((d) => {
              const isActive = d.day === active.day;
              const dateParts = fmtDate(dayDateISO(d)).split(",").filter(Boolean);
              return (
                <button
                  key={d.day}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectDay(d.day)}
                  className="tcc-focus flex shrink-0 items-center gap-2.5 rounded-full p-1.5 pr-4 text-left transition-all"
                  style={{
                    background: isActive ? "var(--coral)" : "transparent",
                    border: isActive
                      ? "1px solid var(--coral)"
                      : "1px solid transparent",
                  }}
                >
                  {/* Number Badge — white on the filled active pill */}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black transition-all"
                    style={{
                      background: isActive ? "#fff" : "rgba(255, 255, 255, 0.08)",
                      color: isActive ? "var(--coral)" : "var(--text-muted)",
                      border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    {d.day}
                  </span>
                  {/* Label & Date */}
                  <span className="hidden sm:block">
                    <span
                      className="block text-[12px] font-bold leading-tight"
                      style={{ color: isActive ? "#fff" : "var(--text-primary)" }}
                    >
                      Day {d.day}
                    </span>
                    {dateParts.length > 0 && (
                      <span
                        className="block text-[10px]"
                        style={{ color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-muted)" }}
                      >
                        {dateParts[0]}, {dateParts[1]?.trim().split(" ")[0]}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            {/* + Add Activity — pinned at the row end on every breakpoint */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="tcc-focus ml-auto flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 py-2 text-[11px] font-semibold text-slate-400 hover:border-[var(--coral)] hover:text-[var(--coral)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add activity
            </button>
          </div>

          {/* 2. Day Activities List — compact connected route timeline */}
          <div className="min-w-0 p-4 sm:p-5">
            {/* Header info */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--coral)]">
                  {fmtDate(dayDateISO(active))
                    ? `Day ${active.day} · ${fmtDate(dayDateISO(active))}`
                    : `Day ${active.day}`}
                </span>
                {active.distance_km && (
                  <p className="text-[11px] text-slate-400">
                    ~{Number(active.distance_km)} km total route
                  </p>
                )}
              </div>
            </div>

            {/* Boxless route nodes — markers joined by a vertical connector,
                no card chrome, just dots in sequence. */}
            <div className="relative">
              {nodeCount > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[25px] left-[25px] top-[25px] w-px bg-white/10"
                />
              )}
              <div className="relative space-y-1.5">
              {/* Day 1 Flight Arrival — timeline node 1 */}
              {isFirstDay && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition-colors hover:bg-white/5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "rgba(255, 114, 94, 0.15)",
                        color: "var(--coral)",
                      }}
                    >
                      <Plane className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-white">
                        {isAirportCode(destination)
                          ? "Arrive at your destination"
                          : `Arrive in ${destination || "Destination"}`}
                      </p>
                      <p className="truncate text-[11px] leading-snug text-slate-400">
                        {flight?.airline ? `${flight.airline} · ` : ""}Airport area
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Day 1 Hotel Check-in — timeline node 2 */}
              {isFirstDay && hotel && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition-colors hover:bg-white/5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "rgba(32, 199, 201, 0.15)",
                        color: "var(--teal)",
                      }}
                    >
                      <Hotel className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-white">
                        Check in to Hotel
                      </p>
                      {/* No invented check-in time: the API sends no hours,
                          so only the confirmed hotel name is shown. */}
                      <p className="truncate text-[11px] leading-snug text-slate-400">
                        {hotel.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Stops for Active Day */}
              {Array.isArray(active.places) && active.places.length > 0 ? (
                active.places.map((place, idx) => {
                  const meta = CATEGORY_META[place.category === "restaurants" ? "restaurant" : "attraction"];
                  const Icon = meta?.icon || Map;
                  const mapUrl = placeMapUrl(place);
                  const thumb = place.image || photoFor(destination, idx);
                  const selected = selectedStop === place.name;
                  const stopName = displayPlaceName(place, idx);
                  const toggleSelected = () => setSelectedStop(selected ? null : place.name);

                  return (
                    <div
                      key={`${place.name}-${idx}`}
                      className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/5"
                      style={
                        selected
                          ? {
                              background: "rgba(255, 114, 94, 0.12)",
                              border: "1px solid rgba(255, 114, 94, 0.45)",
                            }
                          : { border: "1px solid transparent" }
                      }
                    >
                      {/* Row click highlights + opens its marker on the map.
                          A div (not a button) wraps the row so the stop name
                          can be a real link without nested interactives. */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleSelected}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSelected();
                          }
                        }}
                        aria-pressed={selected}
                        aria-label={`${stopName} — highlight on map`}
                        className="tcc-focus flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left"
                      >
                        {/* Thumbnail marker with sequence number */}
                        <div className="relative h-9 w-9 shrink-0 overflow-visible rounded-lg">
                          <div className="h-full w-full overflow-hidden rounded-lg">
                          {thumb ? (
                            <SafeImage
                              src={thumb}
                              alt={stopName}
                              className="h-full w-full object-cover"
                              fallback={
                                <div className="flex h-full w-full items-center justify-center bg-white/10 text-white">
                                  <Icon className="h-4 w-4" />
                                </div>
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/10 text-white">
                              <Icon className="h-4 w-4" />
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Stop Details — name links to the map location */}
                        <div className="min-w-0">
                          {mapUrl ? (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={`${stopName} — view on Google Maps`}
                              aria-label={`View ${stopName} on Google Maps`}
                              className="tcc-focus block truncate text-[13px] font-bold text-white transition-colors hover:text-[var(--coral)] hover:underline"
                            >
                              {stopName}
                            </a>
                          ) : (
                            <p className="truncate text-[13px] font-bold text-white" title={stopName}>
                              {stopName}
                            </p>
                          )}
                          <p className="text-[11px] leading-snug text-slate-400">
                            {categoryLabel(place.category)}
                            {place.duration ? ` · ${place.duration}` : ""}
                            {place.rating ? ` · ★ ${place.rating}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">
                  No scheduled places for this day. Click "+ Add activity" to add one!
                </p>
              )}

              {/* User Added Custom Activities for Active Day */}
              {dayCustoms.map((a, idx) => (
                  <div
                    key={`custom-${idx}`}
                    className="flex min-w-0 items-center justify-between gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--teal)]/20 text-[var(--teal)]">
                        ✦
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-white">{a.name}</p>
                        <p className="text-[11px] leading-snug text-slate-400">{a.time}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-[var(--teal)]/20 text-[var(--teal)]">
                      Added
                    </span>
                  </div>
                ))}

              {/* Last Day Check-out — final timeline node */}
              {isLastDay && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition-colors hover:bg-white/5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "rgba(255, 114, 94, 0.15)",
                        color: "var(--coral)",
                      }}
                    >
                      <Plane className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-white">
                        {isAirportCode(destination)
                          ? "Depart from your destination"
                          : `Depart from ${destination || "Destination"}`}
                      </p>
                      <p className="text-[11px] leading-snug text-slate-400">
                        Check out & return flight
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* 3. Interactive Map — full column width below the activities.
              Fixed heights per breakpoint (mobile 320 / tablet 380 /
              desktop 420); the panel ends with the map, no fill leftover.
              "Expand" opens the full map view. */}
          <div className="border-t border-white/[0.08] p-5 sm:p-6">
            {/* Map Top Bar */}
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Interactive Map · Day {active.day}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("map")}
                className="flex items-center gap-1 text-[11px] font-bold text-[var(--coral)] hover:underline"
              >
                <Maximize2 className="h-3 w-3" />
                Expand
              </button>
            </div>

            {/* Embedded Map Component — the fixed heights below size the
                Leaflet canvas itself (mobile 320 / tablet 380 / desktop
                420); status row + legend stack naturally around it. */}
            <div className="w-full overflow-hidden rounded-[16px]">
              <ItineraryMap
                hotel={hotel}
                itinerary={itinerary}
                activeDay={active.day}
                destination={destination}
                onSelectDay={selectDay}
                selectedStop={selectedStop}
                onSelectStop={setSelectedStop}
                mapHeightClass="h-[320px] sm:h-[380px] xl:h-[420px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Full Map View ── */}
      {activeTab === "map" && (
        <div className="flex flex-col p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">
              Full Trip Route & Places
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("itinerary")}
              className="text-xs font-semibold text-[var(--coral)] hover:underline"
            >
              ← Back to Itinerary view
            </button>
          </div>
          <div className="mt-4 min-h-[460px] w-full flex-1 overflow-hidden rounded-[18px]">
            <ItineraryMap
              hotel={hotel}
              itinerary={itinerary}
              activeDay={active.day}
              destination={destination}
              onSelectDay={selectDay}
              selectedStop={selectedStop}
              onSelectStop={setSelectedStop}
            />
          </div>
        </div>
      )}

      {/* ── Add Activity Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="glass-panel w-full max-w-sm rounded-[20px] p-6 text-white"
            style={{ background: "rgba(9, 38, 48, 0.95)" }}
          >
            <h3 className="font-display text-lg font-bold">Add to Day {activeDay}</h3>
            <p className="mt-1 text-xs text-slate-400">
              Add a personal activity or stop to your schedule.
            </p>
            <form onSubmit={handleAddActivity} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400">
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scuba Diving at Grand Island"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[var(--coral)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400">
                  Time / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM · 2 hours"
                  value={newActivityTime}
                  onChange={(e) => setNewActivityTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[var(--coral)]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
