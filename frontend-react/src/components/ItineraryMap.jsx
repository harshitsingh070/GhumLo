import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { placeKey } from "../lib/places.js";

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

/** Exact-match placeholder names providers sometimes return — never pinned raw. */
const JUNK_PLACE_NAMES = new Set(["somewhere", "unknown", "unnamed", "unnamed stop", "tbd", "test"]);

/** Map label: cleaned name, or a category fallback for placeholders. */
function mapLabelFor(raw, destination, category, idx) {
  const cleaned = cleanPlaceName(raw, destination);
  if (!JUNK_PLACE_NAMES.has(cleaned.toLowerCase())) return cleaned;
  return `${category === "restaurants" ? "Restaurant" : "Attraction"} ${idx + 1}`;
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
 *  day is clicked, so the legend doubles as day navigation), selectedStop
 *  (place name currently highlighted in the itinerary list) and
 *  onSelectStop (called when a marker is clicked, so the map highlights the
 *  matching row). The two stay in sync in both directions.
 *  Never throws: init/update wrapped in try/catch, coord-less entries skipped,
 *  total failure renders a fallback line instead of breaking the results view.
 */
export default function ItineraryMap({
  hotel,
  itinerary,
  activeDay,
  destination,
  onSelectDay,
  selectedStop,
  onSelectStop,
  // mapHeightClass: overrides the default Leaflet canvas heights for embeds
  // (the dashboard preview uses 320/380/420px). Map logic, tiles, markers
  // and controls are untouched.
  mapHeightClass = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapError, setMapError] = useState(false);
  // Tile CDN blocked/offline shows a gray canvas with no explanation —
  // surface an honest note instead (markers/routes still work).
  const [tilesDown, setTilesDown] = useState(false);
  // Local view toggle only — tab state still lives in ItinerarySection.
  // Default false = selected day dominant (whole-trip available on demand).
  const [showAll, setShowAll] = useState(false);

  // Latest click callback, kept in a ref so the marker effect never re-runs
  // just because the parent re-created its handler.
  const onSelectStopRef = useRef(onSelectStop);
  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  });

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
      const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      let tileErrors = 0;
      tiles.on("tileerror", () => {
        tileErrors += 1;
        if (tileErrors >= 6) setTilesDown(true);
      });
      tiles.on("tileload", () => {
        tileErrors = 0;
        setTilesDown(false);
      });
      tiles.addTo(map);
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

  // Keep the canvas in sync with the container: the dashboard stretches the
  // itinerary column to match its neighbours, and tab switches change the
  // height too. Leaflet sizes itself once, so react to every box change.
  useEffect(() => {
    const el = containerRef.current;
    const map = mapRef.current;
    if (!el || !map || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        try {
          map.invalidateSize();
        } catch {
          /* ignore — cosmetic only */
        }
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  // Selection sync (list → map): picking an activity pans to its marker and
  // opens the popup. Runs after the data effect has rebuilt the marker set.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStop) return;
    const marker = markersRef.current.get(String(selectedStop));
    if (!marker) return;
    try {
      const ll = marker.getLatLng();
      if (!map.getBounds().pad(-0.15).contains(ll)) map.panTo(ll, { animate: true });
      marker.openPopup();
    } catch {
      /* ignore — selection is a convenience, never fatal */
    }
  }, [selectedStop, itinerary, activeDay, showAll]);

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
      markersRef.current = new Map();
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
        // NOTE: iterate ORIGINAL places (coord-less skipped in place) so the
        // identity key uses the same day+index as the itinerary list.
        const rawStops = Array.isArray(d.places) ? d.places : [];
        const stops = rawStops.filter(hasCoords);
        let badgeNum = 0;
        rawStops.forEach((p, i) => {
          if (!hasCoords(p)) return;
          badgeNum += 1;
          const stopId = placeKey(p, d.day, i);
          // Numbered badge on EVERY stop (visit order within the day at a
          // glance). Permanent name pills are reserved for focus contexts —
          // the selected stop, or the whole active day when isolated via
          // "Selected day" — so clustered whole-trip markers can't bury each
          // other under overlapping pills (hover still names every badge).
          // Pills alternate above/below so kept labels don't overlap.
          // Inactive days: badge + name-on-hover only.
          const above = (badgeNum - 1) % 2 === 0;
          const size = isActive ? 28 : 22;
          const isSel = selectedStop != null && String(selectedStop) === stopId;
          const showLabel = isActive && (!showAll || isSel);
          // Display name: cleaned for the map (suffix stripped, casing
          // fixed, placeholders swapped for a category fallback).
          const label = esc(mapLabelFor(p.name, destination, p.category, badgeNum - 1));
          const marker = L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              className: "stop-badge-wrap",
              html: `<div class="${isActive ? "stop-badge stop-badge-active" : "stop-badge"}" style="background:${color}">${badgeNum}</div>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            }),
            zIndexOffset: isActive ? 400 : 0,
          })
            .bindPopup(
              `<strong>${badgeNum}. ${label}</strong><br/>Day ${esc(d.day)} · ${esc(p.category || "")}` +
                (p.rating != null && p.rating !== "" ? `<br/>Rating: ${esc(p.rating)}` : "")
            )
            .bindTooltip(label, {
              permanent: showLabel,
              direction: above ? "top" : "bottom",
              offset: L.point(0, above ? -(size / 2 + 2) : size / 2 + 2),
              className: showLabel ? "stop-label stop-active" : "stop-label",
              interactive: false,
            });
          marker.on("click", () => onSelectStopRef.current?.(stopId));
          layers.addLayer(marker);
          markersRef.current.set(stopId, marker);
          bounds.push([p.lat, p.lng]);
        });
        // One polyline per consecutive pair. Distance chips render only for
        // the active day in "Selected day" view: in whole-trip view every
        // day's markers crowd the canvas and centered chips bury markers
        // and name pills under themselves (tooltip pane sits above markers).
        // The day's total still shows in the status line and day header.
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
          if (isActive && !showAll) {
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
  }, [itinerary, activeDay, hotel, destination, showAll, selectedStop]);

  if (mapError) {
    return <p className="t-body" style={{ color: "#5B6B7B" }}>Map unavailable — see itinerary list below.</p>;
  }

  return (
    <div
      className="max-w-full rounded-[20px] p-3"
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.06)" }}
    >
      {/* Status + view controls: plain-language summary on the left,
          Whole-trip/Selected-day toggle and Reset view on the right. */}
      <div className="mb-2 flex max-w-full flex-wrap items-center justify-between gap-2">
        <p className="t-meta" style={{ color: "#52606D" }} aria-live="polite">
          {summary}
        </p>
        <div className="flex items-center gap-1.5">
          <div
            className="inline-flex rounded-full p-0.5 t-meta"
            style={{ background: "#F1F5F9", border: "1px solid #E5E7EB" }}
            role="group"
            aria-label="Map view"
          >
            <button
              type="button"
              onClick={() => setShowAll(false)}
              aria-pressed={!showAll}
              className="tcc-touch rounded-full px-3 py-2 transition-colors"
              style={
                !showAll
                  ? { background: "#FF6B57", color: "#FFFFFF", boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)" }
                  : { background: "transparent", color: "#52606D" }
              }
            >
              Selected day
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              aria-pressed={showAll}
              className="tcc-touch rounded-full px-3 py-2 transition-colors"
              style={
                showAll
                  ? { background: "#FF6B57", color: "#FFFFFF", boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)" }
                  : { background: "transparent", color: "#52606D" }
              }
            >
              Whole trip
            </button>
          </div>
          <button
            type="button"
            onClick={resetView}
            title="Zoom back out to all stops"
            className="tcc-touch rounded-full px-3 t-btn-sm transition-colors"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#52606D" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF6B57"; e.currentTarget.style.color = "#102A43"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#52606D"; }}
          >
            Reset view
          </button>
        </div>
      </div>
      {/* relative z-0: keeps Leaflet's internal panes (z-index ~1000) inside
          this stacking context so they can't overlay the sticky budget bar.
          Tiles stay light in both themes (decision: no dark-tile swap);
          only the frame adapts. */}
      <div
        ref={containerRef}
        id="itinerary-map"
        className={`relative z-0 w-full max-w-full overflow-hidden rounded-xl ${
          mapHeightClass || "h-[360px] sm:h-[480px]"
        }`}
        style={{ border: "1px solid #E5E7EB" }}
        role="region"
        aria-label={`Map of itinerary stops. ${summary}. Full list follows for screen readers.`}
      />
      {/* Accessible list alternative — map is never the only representation.
          Visually hidden but available to assistive technology. */}
      <table className="sr-only">
        <caption>Itinerary stops by day and visit order</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">Order</th><th scope="col">Location</th><th scope="col">Category</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            (Array.isArray(d.places) ? d.places : []).map((p, i) => (
              <tr key={`${d.day}-${p.name}-${i}`}>
                <td>{`Day ${d.day}`}</td>
                <td>{i + 1}</td>
                <td>{mapLabelFor(p.name, destination, p.category, i)}</td>
                <td>{p.category || "place"}{p.rating ? `, rating ${p.rating}` : ""}</td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
      {tilesDown && !mapError && (
        <p
          className="mt-1.5 rounded-lg px-2.5 py-1.5 t-meta-sm"
          style={{ color: "#52606D", background: "#F7F9FC", border: "1px solid #E5E7EB" }}
          role="status"
        >
          Map tiles couldn&apos;t load — the tile network may be blocked. Markers, routes and
          distances still work; the stop list has every detail.
        </p>
      )}
      {/* Plain HTML/Tailwind legend (not a Leaflet control): hotel key +
          one swatch per day, matching marker colors. Day swatches are buttons
          that jump to that day's tab — the legend doubles as navigation. */}
      <div
        className="mt-2 flex max-w-full flex-wrap items-center gap-x-1 gap-y-1 rounded-[12px] px-1.5 py-1 t-meta"
        style={{ background: "#F7F9FC", border: "1px solid #EEF2F6", color: "#52606D" }}
      >
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5">
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full t-badge-sm"
            style={{ background: "#52606D", color: "#FFFFFF", boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)" }}
          >
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
              className="tcc-touch inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-colors"
              style={
                selected
                  ? { background: "#FFF1EE", color: "#102A43", fontWeight: 600, border: "1px solid #FF6B57" }
                  : { background: "transparent", color: "#52606D", border: "1px solid transparent" }
              }
            >
              <span
                className="inline-block h-3 w-3 rounded-full shadow"
                style={{ backgroundColor: colorForDay(d.day), border: "1px solid #FFFFFF" }}
              />
              Day {d.day}
            </button>
          );
        })}
      </div>
      <p className="mt-1 t-meta-sm" style={{ color: "#5B6B7B" }}>
        Badge numbers show visit order — hover for names, click for details.
      </p>
    </div>
  );
}
