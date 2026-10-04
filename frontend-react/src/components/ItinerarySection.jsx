import { useEffect, useState } from "react";
import { Plus, Maximize2 } from "lucide-react";
import ItineraryMap from "./ItineraryMap.jsx";

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

/** Compact pill date: "Sat, 10" for the day chips. */
const shortDay = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(`${iso}T12:00:00`);
  return `${weekdays[d.getDay()]}, ${Number(m[3])}`;
};

/** Sequence badge palette — cyan → green → yellow → purple → red. */
const BADGE_COLORS = ["#22D3EE", "#22C55E", "#EAB308", "#A855F7", "#F87171", "#2DD4BF", "#FB9231"];

/** Right-side slot tags for stops. The API sends no per-stop times, so the
 *  slot is derived from category + visit order: first restaurant → Lunch,
 *  second → Evening tea, later ones → Dinner; the day's final attraction
 *  → Sunset view, other attractions → Sightseeing. */
function stopSlot(place, idx, total, restaurantSeen) {
  const isRestaurant = String(place?.category || "").toLowerCase().startsWith("restaurant");
  if (isRestaurant) {
    if (restaurantSeen === 0) return { label: "Lunch", color: "#FBBF24", emoji: "🍽" };
    if (restaurantSeen === 1) return { label: "Evening tea", color: "#94A3B8", emoji: "☕" };
    return { label: "Dinner", color: "#FB9231", emoji: "🍽" };
  }
  if (idx === total - 1) return { label: "Sunset view", color: "#FF7A59", emoji: "🌅" };
  return { label: "Sightseeing", color: "#38BDF8", emoji: "📍" };
}

/** Unified Itinerary + Map Module — Center column of 3-column dashboard.
 *  Inside:
 *    - Day picker pills (Day 1 (Sun, 12)...) with dates
 *    - Day's route as numbered cards with day-part tags
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
  const nights =
    num_nights != null && Number.isFinite(Number(num_nights))
      ? Number(num_nights)
      : itinerary.length;

  /* Numbered route cards in visit order: arrival → hotel → stops →
   * customs → departure, numbered 1..N without gaps. */
  const dayCustoms = customActivities.filter((a) => a.day === activeDay);
  const stops = Array.isArray(active.places) ? active.places : [];
  const nodes = [];
  let n = 0;
  const badge = () => BADGE_COLORS[(n - 1) % BADGE_COLORS.length];
  if (isFirstDay) {
    n += 1;
    nodes.push({
      key: "arrive",
      num: n,
      color: badge(),
      title: isAirportCode(destination)
        ? "Arrive at your destination"
        : `Arrive in ${destination || "Destination"}`,
      sub: `${flight?.airline ? `${flight.airline} · ` : ""}Airport area`,
      tag: "Flight arrival",
      tagColor: "#2DD4BF",
      emoji: "✈",
    });
  }
  if (isFirstDay && hotel) {
    n += 1;
    nodes.push({
      key: "hotel",
      num: n,
      color: badge(),
      title: "Check in to Hotel",
      sub: hotel.name,
      tag: "Check-in",
      tagColor: "#D9A441",
      emoji: "🏨",
    });
  }
  let restaurantSeen = 0;
  stops.forEach((place, idx) => {
    const slot = stopSlot(place, idx, stops.length, restaurantSeen);
    if (String(place?.category || "").toLowerCase().startsWith("restaurant")) restaurantSeen += 1;
    n += 1;
    nodes.push({
      key: `stop-${place.name}-${idx}`,
      type: "stop",
      place,
      num: n,
      color: badge(),
      title: displayPlaceName(place, idx),
      sub: `${categoryLabel(place.category)}${place.rating ? ` • ${place.rating}` : ""}`,
      tag: slot.label,
      tagColor: slot.color,
      emoji: slot.emoji,
    });
  });
  dayCustoms.forEach((a, idx) => {
    n += 1;
    nodes.push({
      key: `custom-${idx}`,
      num: n,
      color: badge(),
      title: a.name,
      sub: a.time,
      tag: "Added",
      tagColor: "#34D399",
      emoji: "✦",
    });
  });
  if (isLastDay) {
    n += 1;
    nodes.push({
      key: "depart",
      num: n,
      color: badge(),
      title: isAirportCode(destination)
        ? "Depart from your destination"
        : `Depart from ${destination || "Destination"}`,
      sub: "Check out & return flight",
      tag: "Departure",
      tagColor: "#2DD4BF",
      emoji: "✈",
    });
  }

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

  const dayLabel = fmtDate(dayDateISO(active));

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
      <div className="border-b border-white/[0.06] px-4 py-2.5">
        <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Day-by-day itinerary • {itinerary.length} day{itinerary.length === 1 ? "" : "s"},{" "}
          {nights} night{Number(nights) === 1 ? "" : "s"}
        </span>
      </div>

      {/* ── Itinerary (Days → Activities → Map, stacked) ── */}
      {activeTab === "itinerary" && (
        <div className="flex flex-col">
          {/* 1. Day selector — compact pills with weekday + date. */}
          <div
            className="flex items-center gap-2 overflow-x-auto border-b border-white/[0.08] p-3"
            style={{ scrollbarWidth: "none" }}
            role="tablist"
            aria-label="Itinerary days"
          >
            {itinerary.map((d) => {
              const isActive = d.day === active.day;
              const sd = shortDay(dayDateISO(d));
              return (
                <button
                  key={d.day}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectDay(d.day)}
                  className="tcc-focus shrink-0 rounded-[10px] px-3 py-2 text-[12px] font-bold transition-all"
                  style={
                    isActive
                      ? { background: "var(--coral)", color: "#fff" }
                      : {
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  Day {d.day}{sd ? ` (${sd})` : ""}
                </button>
              );
            })}
          </div>

          {/* 2. Day Activities List — badges on a vertical line, cards right. */}
          <div className="min-w-0 p-4 sm:p-5">
            {/* Day scope line */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold tracking-wider">
                <span className="uppercase" style={{ color: "var(--coral)" }}>Day {active.day}</span>
                {dayLabel && <span className="uppercase text-slate-500"> • {dayLabel}</span>}
                {active.distance_km && (
                  <span className="text-slate-500"> • ~{Number(active.distance_km)} km total route</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="tcc-focus flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[var(--coral)]"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            <div className="relative">
              {nodes.length > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[26px] left-[11px] top-[26px] w-px bg-white/10"
                />
              )}
              <div className="relative space-y-2">
              {nodes.length > 0 ? (
                nodes.map((node) => {
                  const selected = node.type === "stop" && selectedStop === node.place.name;
                  const toggleSelected = () =>
                    setSelectedStop(selected ? null : node.place.name);
                  const card = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-white">
                          {node.title}
                        </span>
                        {node.sub && (
                          <span className="block truncate text-[11px] text-slate-400">
                            {node.sub}
                          </span>
                        )}
                      </span>
                      {node.tag && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-[10px] font-semibold"
                          style={{ color: node.tagColor }}
                        >
                          <span aria-hidden="true">{node.emoji}</span>
                          {node.tag}
                        </span>
                      )}
                    </>
                  );
                  const style = selected
                    ? {
                        background: "rgba(255, 114, 94, 0.12)",
                        border: "1px solid rgba(255, 114, 94, 0.45)",
                      }
                    : {
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      };
                  /* Stop rows highlight their marker on the map — a
                   * row click toggles it, so the title stays plain text. */
                  if (node.type === "stop") {
                    return (
                      <div key={node.key} className="flex items-center gap-2.5">
                        <span
                          className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                          style={{ background: node.color }}
                          aria-hidden="true"
                        >
                          {node.num}
                        </span>
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
                          aria-label={`${node.title} — highlight on map`}
                          className="tcc-focus flex min-w-0 flex-1 items-center gap-2 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                          style={style}
                        >
                          {card}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={node.key} className="flex items-center gap-2.5">
                      <span
                        className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                        style={{ background: node.color }}
                        aria-hidden="true"
                      >
                        {node.num}
                      </span>
                      <div
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-[12px] px-3 py-2.5"
                        style={style}
                      >
                        {card}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">
                  No scheduled places for this day. Click "+ Add" to add one!
                </p>
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
