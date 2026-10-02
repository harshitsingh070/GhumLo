import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Per-day marker palette (cycles if >6 days). Module-local: the legend below
 * reads the same constants, so marker and legend colors can't drift apart. */
const DAY_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4"];
const HOTEL_COLOR = "#475569";

const colorForDay = (day) => DAY_COLORS[(Number(day) - 1 + DAY_COLORS.length) % DAY_COLORS.length];

const isCoord = (v) => typeof v === "number" && Number.isFinite(v);
const hasCoords = (p) => !!p && isCoord(p.lat) && isCoord(p.lng);

/** Straight-line distance between two lat/lng points, in km — same
 *  haversine formula as backend itinerary.haversine_km, so per-leg labels
 *  sum to ~the day's distance_km subtitle. Pure math, zero API calls. */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

/** Compact leg label: "0.8 km" below 10 km, whole km above. */
const fmtKm = (km) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

/** Words that stay lowercase inside a cleaned name ("Elephant and Co."). */
const SMALL_WORDS = new Set(["and", "or", "of", "the", "a", "an", "&", "de", "da", "ka", "ki", "ke"]);

/** Tidy a raw SerpApi place name for map display:
 *  - collapses stray whitespace,
 *  - strips a redundant trailing trip-destination suffix ("X, Goa" → "X"
 *    when the whole trip is in Goa),
 *  - fixes all-lowercase words ("Sunset point" → "Sunset Point") while
 *    NEVER touching words that already contain capitals ("McDonald's",
 *    "OYO", "Co." pass through byte-identical).
 *  Pure display helper — list rendering elsewhere keeps raw names. */
function cleanPlaceName(raw, destination) {
  let s = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "Unnamed stop";
  if (destination && String(destination).trim()) {
    const d = String(destination).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`(,\\s*${d}|\\s+${d})$`, "i"), "").trim();
  }
  s = s
    .split(" ")
    .map((w, i) => {
      if (!w || /[A-Z]/.test(w)) return w; // already cased — leave alone
      const core = w.replace(/^[^a-z]+|[^a-z]+$/g, "");
      if (i > 0 && SMALL_WORDS.has(core)) return w; // keep "and", "of", …
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
  return s || "Unnamed stop";
}

/** Minimal HTML-escape for popup/tooltip strings (names come from SerpApi). */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Clustered-itinerary map. Shows ALL days at once (each day in its own
 *  color) with the active tab's day visually emphasized — no markers are
 *  ever hidden on tab switch.
 *
 *  LABELING (focus mode, keeps the map readable): only the ACTIVE day gets
 *  permanent labels — numbered name pills ("1 · Name", alternating above /
 *  below the marker so close stops don't overlap) plus per-leg distance
 *  chips. Inactive days render as plain colored dots; hovering any dot
 *  shows its name, clicking shows the full popup. The hotel keeps one
 *  permanent tag as the trip anchor.
 *
 *  MARKER-ICON DECISION: stops use numbered L.divIcon badges (HTML/CSS) and
 *  the hotel uses an "H" divIcon — so Leaflet's default pin images are never
 *  requested and the known Vite breakage (marker-icon.png 404s under
 *  bundling — normally fixed by deleting
 *  L.Icon.Default.prototype._getIconUrl and re-pointing icon URLs at
 *  imported 'leaflet/dist/images/*' assets) does not apply here. HTML
 *  badges are also the better fit: per-day coloring + stop numbers need
 *  dynamic content, which image pins can't do without generating N assets.
 *
 *  Props: hotel {name, lat, lng}, itinerary [{day, places:[{name, category,
 *  rating, lat, lng}]}], activeDay (number, reuses ItinerarySection tab state),
 *  destination (string, optional — used only to strip redundant ", Goa"-style
 *  suffixes from map labels), onSelectDay (optional: called when a legend
 *  day is clicked, so the legend doubles as day navigation).
 *  Never throws: init/update wrapped in try/catch, coord-less entries skipped,
 *  total failure renders a fallback line instead of breaking the results view.
 */
export default function ItineraryMap({ hotel, itinerary, activeDay, destination, onSelectDay }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const [mapError, setMapError] = useState(false);
  // Local view toggle only — tab state still lives in ItinerarySection.
  // true = whole trip (all days), false = selected day in isolation.
  const [showAll, setShowAll] = useState(true);

  const days = Array.isArray(itinerary) ? itinerary : [];
  const active = days.find((d) => Number(d.day) === Number(activeDay)) ?? days[0];

  // Plain-language status line: "Day 2 of 3 · 3 stops · 1.3 km route".
  const stopCount = active && Array.isArray(active.places) ? active.places.length : 0;
  const summary = active
    ? `Day ${active.day} of ${days.length} · ${stopCount} stop${stopCount === 1 ? "" : "s"}` +
      (active.distance_km ? ` · ${Number(active.distance_km)} km route` : "")
    : "No stops to show.";

  const resetView = () => {
    try {
      const map = mapRef.current;
      const b = lastBoundsRef.current;
      if (map && b && b.isValid()) map.fitBounds(b, { padding: [30, 30] });
    } catch (err) {
      console.error("ItineraryMap reset view failed:", err);
    }
  };

  // Mount-once: create the Leaflet instance + OSM tile layer. Cleanup only
  // on unmount (also handles React StrictMode dev double-mount). Never
  // re-created on tab switches or new plans — data updates go through the
  // second effect below, which only clears/re-adds layers.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = L.map(containerRef.current, { scrollWheelZoom: false, preferCanvas: true }).setView([15.5, 73.8], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      layersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Let tiles paint at the real container size after first layout.
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          /* ignore — cosmetic only */
        }
      }, 0);
    } catch (err) {
      console.error("ItineraryMap init failed:", err);
      setMapError(true);
    }
    return () => {
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore teardown errors */
      }
      mapRef.current = null;
      layersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data effect: clear all markers/polylines, then re-add fresh from props.
  // Runs on mount (after the instance exists) and whenever itinerary,
  // activeDay, hotel, or the local Whole-trip/Selected-day toggle changes —
  // so a second plan leaves zero stale pins.
  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;
    try {
      layers.clearLayers();
      const bounds = [];
      // Whole-trip view shows every day; Selected-day view isolates the
      // active tab. Hotel is always shown as the trip anchor.

      // The hotel gets a distinct "H" pin (divIcon = HTML/CSS, no image
      // assets) raised above the stop dots, tagged plainly as "Hotel".
      // Full name lives one click away in the popup.
      if (hasCoords(hotel)) {
        layers.addLayer(
          L.marker([hotel.lat, hotel.lng], {
            icon: L.divIcon({
              className: "hotel-pin",
              html: `<div class="hotel-pin-inner" style="background:${HOTEL_COLOR}">H</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
            zIndexOffset: 500,
            title: `Hotel: ${hotel.name || "Hotel"}`,
          })
            .bindPopup(`<strong>Hotel: ${esc(hotel.name || "Hotel")}</strong>`)
            .bindTooltip("Hotel", {
              permanent: true,
              direction: "top",
              offset: L.point(0, -18),
              className: "hotel-label",
              interactive: false,
            })
        );
        bounds.push([hotel.lat, hotel.lng]);
      }

      const visible = showAll ? days : days.filter((d) => Number(d.day) === Number(activeDay));
      for (const d of visible) {
        const color = colorForDay(d.day);
        const isActive = Number(d.day) === Number(activeDay);
        const stops = (Array.isArray(d.places) ? d.places : []).filter(hasCoords);
        stops.forEach((p, i) => {
          // Numbered badge on EVERY stop (visit order within the day at a
          // glance); active day gets a bigger badge + permanent name pill
          // (number lives on the badge, so the pill shows just the name).
          // Pills alternate above/below so clustered stops don't overlap.
          // Inactive days: badge + name-on-hover only.
          const above = i % 2 === 0;
          const size = isActive ? 28 : 22;
          // Display name: cleaned for the map (suffix stripped, casing
          // fixed); the day list below keeps the raw SerpApi name.
          const label = esc(cleanPlaceName(p.name, destination));
          layers.addLayer(
            L.marker([p.lat, p.lng], {
              icon: L.divIcon({
                className: "stop-badge-wrap",
                html: `<div class="${isActive ? "stop-badge stop-badge-active" : "stop-badge"}" style="background:${color}">${i + 1}</div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              }),
              zIndexOffset: isActive ? 400 : 0,
            })
              .bindPopup(
                `<strong>${i + 1}. ${label}</strong><br/>Day ${esc(d.day)} · ${esc(p.category || "")}` +
                  (p.rating != null && p.rating !== "" ? `<br/>Rating: ${esc(p.rating)}` : "")
              )
              .bindTooltip(label, {
                permanent: isActive,
                direction: above ? "top" : "bottom",
                offset: L.point(0, above ? -(size / 2 + 2) : size / 2 + 2),
                className: isActive ? "stop-label stop-active" : "stop-label",
                interactive: false,
              })
          );
          bounds.push([p.lat, p.lng]);
        });
        // One polyline per consecutive pair so each leg gets its own centered
        // distance label at the segment midpoint — labels for the active day
        // only; other days keep a faint path with no chips.
        // Coord-less stops were already filtered out of `stops`.
        for (let i = 0; i + 1 < stops.length; i++) {
          const a = stops[i];
          const b = stops[i + 1];
          const leg = L.polyline(
            [
              [a.lat, a.lng],
              [b.lat, b.lng],
            ],
            { color, weight: isActive ? 3 : 2, opacity: isActive ? 0.9 : 0.35 }
          );
          if (isActive) {
            leg.bindTooltip(fmtKm(haversineKm(a.lat, a.lng, b.lat, b.lng)), {
              permanent: true,
              direction: "center",
              className: "leg-label",
              interactive: false,
            });
          }
          layers.addLayer(leg);
        }
      }

      if (bounds.length > 0) {
        // Remember the fitted area so "Reset view" can restore it after
        // the user pans/zooms. Cleared on empty data.
        lastBoundsRef.current = L.latLngBounds(bounds);
        map.fitBounds(lastBoundsRef.current, { padding: [30, 30], maxZoom: 14 });
      } else {
        lastBoundsRef.current = null;
      }
    } catch (err) {
      console.error("ItineraryMap update failed:", err);
      setMapError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary, activeDay, hotel, destination, showAll]);

  if (mapError) {
    return <p className="text-sm text-slate-500">Map unavailable — see itinerary list below.</p>;
  }

  return (
    <div className="max-w-full">
      {/* Status + view controls: plain-language summary on the left,
          Whole-trip/Selected-day toggle and Reset view on the right. */}
      <div className="mb-2 flex max-w-full flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300" aria-live="polite">
          {summary}
        </p>
        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium dark:bg-slate-700"
            role="group"
            aria-label="Map view"
          >
            <button
              type="button"
              onClick={() => setShowAll(false)}
              aria-pressed={!showAll}
              className={`rounded-full px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                !showAll
                  ? "bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Selected day
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              aria-pressed={showAll}
              className={`rounded-full px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                showAll
                  ? "bg-white text-slate-900 shadow dark:bg-slate-600 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Whole trip
            </button>
          </div>
          <button
            type="button"
            onClick={resetView}
            title="Zoom back out to all stops"
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Reset view
          </button>
        </div>
      </div>
      {/* relative z-0: keeps Leaflet's internal panes (z-index ~1000) inside
          this stacking context so they can't overlay the sticky budget bar.
          Tiles stay light in both themes (decision: no dark-tile swap — see
          report); only the frame adapts. */}
      <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/80">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Trip map</p>
          <p className="text-xs text-slate-700 dark:text-slate-200">Hotel anchor · colored routes · numbered stops</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-200">{showAll ? "All days" : `Day ${active?.day || 1}`}</span>
      </div>
      <div
        ref={containerRef}
        className="relative z-0 h-[360px] w-full max-w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 sm:h-[480px]"
        role="img"
        aria-label="Map of clustered itinerary stops"
      />
      {/* Plain HTML/Tailwind legend (not a Leaflet control): hotel key +
          one swatch per day, matching marker colors. Day swatches are buttons
          that jump to that day's tab — the legend doubles as navigation. */}
      <div className="mt-2 flex max-w-full flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white shadow ring-2 ring-white">
            H
          </span>
          Hotel
        </span>
        {days.map((d) => {
          const selected = Number(d.day) === Number(activeDay);
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onSelectDay?.(d.day)}
              aria-pressed={selected}
              title={`Show Day ${d.day} stops`}
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 ${
                selected ? "bg-slate-100 font-semibold text-slate-900 ring-1 ring-slate-300 dark:bg-slate-700 dark:text-white dark:ring-slate-500" : ""
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-white shadow"
                style={{ backgroundColor: colorForDay(d.day) }}
              />
              Day {d.day}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
        Badge numbers show visit order within each day — hover any badge for its name, click
        for details. Line labels show straight-line distance between consecutive stops.
      </p>
    </div>
  );
}
