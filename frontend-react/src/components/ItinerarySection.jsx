import { useEffect, useRef, useState } from "react";
import { Plus, Maximize2, X } from "lucide-react";
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

/** Sequence badge — single brand color (was a dead 7x duplicated array). */
const BADGE_COLOR = "#FF6B57";

/** Honest stop tag: only what the data actually says (category).
 *  Never invent meal times (Lunch/Dinner) or views (Sunset view) — the API
 *  sends no per-stop times. */
function stopSlot(place) {
  const isRestaurant = String(place?.category || "").toLowerCase().startsWith("restaurant");
  if (isRestaurant) return { label: "Restaurant", color: "#B45309", emoji: "🍽" };
  return { label: "Attraction", color: "#1D4ED8", emoji: "📍" };
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
  const modalRef = useRef(null);
  const lastFocusRef = useRef(null);

  useEffect(() => {
    setActiveDay(1);
    setSelectedStop(null);
    onActiveDayChange?.(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary]);

  /* Modal a11y: Escape-to-close, focus trap, focus restore. */
  useEffect(() => {
    if (!showAddModal) return;
    lastFocusRef.current = document.activeElement;
    const modal = modalRef.current;
    const input = modal?.querySelector('input[type="text"]');
    input?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowAddModal(false);
        return;
      }
      if (e.key !== "Tab" || !modal) return;
      const focusables = Array.from(
        modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocusRef.current?.focus?.();
    };
  }, [showAddModal]);

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
  const badge = () => BADGE_COLOR;
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
      tagColor: "#3B82F6",
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
      tagColor: "#8B5CF6",
      emoji: "🏨",
    });
  }
  stops.forEach((place, idx) => {
    const slot = stopSlot(place);
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
      tagColor: "#22C55E",
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
      tagColor: "#3B82F6",
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
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* Trip scope meta — day/night scope only. Raw fetch `counts` are
          internal API stats, not itinerary content, so they stay out of this
          header (they remain available in the plan response for debugging). */}
      <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #EEF2F6" }}>
        <span className="t-meta" style={{ color: "#102A43" }}>
          Day-by-day itinerary • {itinerary.length} day{itinerary.length === 1 ? "" : "s"},{" "}
          {nights} night{Number(nights) === 1 ? "" : "s"}
        </span>
      </div>

      {/* ── Itinerary (Days → Activities → Map, stacked) ── */}
      {activeTab === "itinerary" && (
        <div className="flex flex-col">
          {/* 1. Day selector — compact pills with weekday + date. */}
          <div
            className="flex items-center gap-2 overflow-x-auto p-3"
            style={{ scrollbarWidth: "none", borderBottom: "1px solid #EEF2F6" }}
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
                  aria-controls="itinerary-day-panel"
                  onClick={() => selectDay(d.day)}
                  className="tcc-focus tcc-touch shrink-0 rounded-[10px] px-4 t-btn-sm transition-all"
                  style={
                    isActive
                      ? { background: "#FF6B57", color: "#FFFFFF", border: "1px solid #FF6B57" }
                      : {
                          background: "#FFFFFF",
                          border: "1px solid #E5E7EB",
                          color: "#52606D",
                        }
                  }
                >
                  Day {d.day}{sd ? ` (${sd})` : ""}
                </button>
              );
            })}
          </div>

          {/* 2. Day Activities List — badges on a vertical line, cards right. */}
          <div id="itinerary-day-panel" role="tabpanel" className="min-w-0 p-4 sm:p-5">
            {/* Day scope line */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="t-day">
                <span className="uppercase" style={{ color: "#FF6B57" }}>Day {active.day}</span>
                {dayLabel && <span className="uppercase" style={{ color: "#5B6B7B" }}> • {dayLabel}</span>}
                {active.distance_km && (
                  <span style={{ color: "#5B6B7B" }}> • ~{Number(active.distance_km)} km total route</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="tcc-focus tcc-touch flex shrink-0 items-center gap-1 rounded-lg px-2 t-btn-sm"
                style={{ color: "#5B6B7B" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF6B57"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#5B6B7B"; }}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            <div className="relative">
              {nodes.length > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[26px] left-[11px] top-[26px] w-px"
                  style={{ background: "#E5E7EB" }}
                />
              )}
              <ul className="relative space-y-2">
              {nodes.length > 0 ? (
                nodes.map((node) => {
                  const selected = node.type === "stop" && selectedStop === node.place.name;
                  const toggleSelected = () =>
                    setSelectedStop(selected ? null : node.place.name);
                  const stopId = `itinerary-stop-${active.day}-${node.num}`;
                  const card = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate t-body-strong" style={{ color: "#102A43" }}>
                          {node.title}
                        </span>
                        {node.sub && (
                          <span className="block truncate t-meta-sm" style={{ color: "#5B6B7B" }}>
                            {node.sub}
                          </span>
                        )}
                      </span>
                      {node.tag && (
                        <span
                          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 t-badge-sm"
                          style={{ color: node.tagColor, background: `${node.tagColor}14`, border: `1px solid ${node.tagColor}30` }}
                        >
                          <span aria-hidden="true">{node.emoji}</span>
                          {node.tag}
                        </span>
                      )}
                    </>
                  );
                  const style = selected
                    ? {
                        background: "var(--color-brand-bg)",
                        border: "1px solid var(--color-brand)",
                      }
                    : {
                        background: "#F7F9FC",
                        border: "1px solid #E5E7EB",
                      };
                  /* Stop rows are real buttons: native Enter/Space,
                   * aria-expanded + aria-controls bind to the map. */
                  if (node.type === "stop") {
                    return (
                      <li key={node.key} className="flex items-center gap-2.5">
                        <span
                          className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full t-badge"
                          style={{ background: "var(--color-brand)", color: "#FFFFFF" }}
                          aria-hidden="true"
                        >
                          {node.num}
                        </span>
                        <button
                          type="button"
                          id={stopId}
                          onClick={toggleSelected}
                          aria-expanded={selected}
                          aria-controls="itinerary-map"
                          aria-label={`${node.title} — highlight on map`}
                          className="tcc-focus flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[12px] px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
                          style={style}
                        >
                          {card}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={node.key} className="flex items-center gap-2.5">
                      <span
                        className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full t-badge"
                        style={{ background: "var(--color-brand)", color: "#FFFFFF" }}
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
                    </li>
                  );
                })
              ) : (
                <p className="py-6 text-center t-meta" style={{ color: "#5B6B7B" }}>
                  No scheduled places for this day. Click "+ Add" to add one!
                </p>
              )}
              </ul>
            </div>
          </div>

          {/* 3. Interactive Map — full column width below the activities.
              Fixed heights per breakpoint (mobile 320 / tablet 380 /
              desktop 420); the panel ends with the map, no fill leftover.
              "Expand" opens the full map view. */}
          <div className="p-5 sm:p-6" style={{ borderTop: "1px solid #EEF2F6" }}>
            {/* Map Top Bar */}
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="t-badge uppercase" style={{ color: "#5B6B7B" }}>
                Interactive Map · Day {active.day}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("map")}
                className="tcc-touch flex items-center gap-1 rounded-lg px-2 t-btn-sm hover:underline"
                style={{ color: "var(--color-brand)" }}
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
            <h3 className="font-display t-card" style={{ color: "#102A43" }}>
              Full Trip Route & Places
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("itinerary")}
              className="tcc-touch rounded-lg px-2 t-btn-sm hover:underline"
              style={{ color: "var(--color-brand)" }}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.35)" }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-activity-title"
            className="glass-panel w-full max-w-sm rounded-[20px] p-6"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="add-activity-title" className="font-display t-card-lg" style={{ color: "#102A43" }}>Add to Day {activeDay}</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close add activity dialog"
                className="tcc-focus tcc-touch rounded-full"
                style={{ border: "1px solid #E5E7EB", color: "#5B6B7B" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 t-meta" style={{ color: "#5B6B7B" }}>
              Add a personal activity or stop to your schedule.
            </p>
            <form onSubmit={handleAddActivity} className="mt-4 space-y-3">
              <div>
                <label className="t-label uppercase" style={{ color: "#5B6B7B" }}>
                  Activity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scuba Diving at Grand Island"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 t-input outline-none"
                  style={{ border: "1px solid #E5E7EB", background: "#F7F9FC", color: "#102A43" }}
                />
              </div>
              <div>
                <label className="t-label uppercase" style={{ color: "#5B6B7B" }}>
                  Time / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM · 2 hours"
                  value={newActivityTime}
                  onChange={(e) => setNewActivityTime(e.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 t-input outline-none"
                  style={{ border: "1px solid #E5E7EB", background: "#F7F9FC", color: "#102A43" }}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary tcc-touch flex-1 t-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary tcc-touch flex-1 t-btn-sm"
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
