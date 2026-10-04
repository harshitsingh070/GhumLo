# GhoomLo — plan trips that fit your budget

**Travel & Local Discovery track — SerpApi India Hackathon 2026.**

Enter **origin, destination, dates, travelers, budget (₹)** → get live flight + hotel options (SerpApi Google Flights / Hotels), the cheapest combination that fits your budget, nearby attractions + restaurants (SerpApi Google Maps), and a day-by-day itinerary with a budget breakdown.

No database, no auth — everything is per-request. The UI is React + Tailwind, pre-built to `frontend-react/dist/` and served by Spring Boot — **you do not need Node.js to run this app**, only Java 17 + Maven.

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [SerpApi engines used (and why)](#serpapi-engines-used-and-why)
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart)
- [Complete usage guide](#complete-usage-guide)
- [API reference](#api-reference)
- [Example plan response](#example-plan-response)
- [How the budget algorithm works](#how-the-budget-algorithm-works)
- [How the itinerary builder works](#how-the-itinerary-builder-works)
- [Quota notes (no price cache)](#quota-notes-no-price-cache)
- [Configuration](#configuration)
- [Repo layout](#repo-layout)
- [Frontend development](#frontend-development-optional--only-if-you-modify-the-react-ui)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)

---

## Features

### Core trip planner (`POST /api/plan`)

- **Flight search** — live options with airline, total price (× travelers), per-person price, duration, stops, departure/arrival airports. Accepts **airport codes (`DEL`, `LHR`) or plain city names (`Goa`, `Delhi`, `London`)**.
- **Offline city → airport resolution** — 7,884-airport dataset bundled in the backend, zero network calls:
  - exact code passthrough (`DEL` → `DEL`; `GOA` stays Genoa, Italy),
  - multi-airport overrides (`London` → `LHR`, `New York` → `JFK`, `Paris` → `CDG`, `Tokyo` → `NRT`, `Moscow` → `SVO`),
  - `Goa` → `GOI` alias (dataset lists it under "Dabolim"),
  - substring fallback over city then airport name (`Delhi` → `New Delhi`/`DEL`, `Bengaluru` via airport name),
  - typo tolerance with the same difflib ≥ 0.8 algorithm as the original (`lucnknow` → `LKO`, `Mumbay` → `BOM`, `Jaipor` → `JAI`).
  - Unresolvable cities return **HTTP 400 with a friendly message** before any SerpApi call (no quota burned).
- **Hotel search** — live options with name, rating, ₹/night, total for the stay, amenities (top 6), and lat/lng. Sorted cheapest-first.
- **Budget matching** — every flight × hotel combo is priced; cheapest combo within budget wins. If nothing fits, the cheapest overall is returned with `fits_budget: false`, `over_by`, and data-backed savings ideas. Top fitting combos returned as `other_options`.
- **Hotel picker ("More stays")** — top-5 cheapest hotels with **dynamic tier badges** (`Budget` / `Mid-range` / `Higher-end` computed as tertiles of *this destination's* fetched price range — no hardcoded ₹ thresholds, so it works in Goa and London alike). Picking one **re-plans the same trip around that hotel** (cheapest flight + pinned hotel, fresh places anchor, same response shape).
- **Places: attractions + restaurants** — two separate `google_maps` searches anchored at `"<winning hotel>, <destination>"`. Each place has name, rating, category, address, lat/lng.
- **Proximity-clustered itinerary** — greedy nearest-neighbor days seeded from the winning hotel (see [algorithm](#how-the-itinerary-builder-works)). Capped at **3 stops/day**, each day guarantees attraction + restaurant variety when the pool allows, and carries `distance_km` (sum of haversine legs, 1 decimal).
- **Interactive Leaflet map** — all days shown at once, each day its own color; hotel gets a distinct `H` pin; stops are numbered badges in visit order; active day gets name pills + per-leg distance chips (`0.8 km` style); **Whole-trip / Selected-day toggle**, **Reset view**, clickable legend that doubles as day navigation. No Leaflet image assets (pure HTML/CSS divIcons, so no Vite `marker-icon.png` 404). Coord-less entries are skipped gracefully; total map failure renders a fallback line instead of breaking results.
- **Day tabs** — one tab per day, defaults to Day 1, resets on each new plan.
- **Savings suggestions (over-budget only)** — up to 2 concrete ideas computed from already-fetched data, zero new API calls: `CHEAPER_HOTEL`, `CHEAPER_FLIGHT` (equal-or-fewer-stops filter), `SHORTER_TRIP` (one fewer night ≈ `hotel_total / nights`). Messages honestly say whether the saving closes the gap or only reduces it. `[]` when already cheapest.
- **Trip insight** — one-sentence summary from real numbers (budget headroom + avg place rating + day tightness), e.g. *"Comfortable fit — ₹12,400 to spare, and your stops average 4.3★."* Never crashes; falls back to a factual line.
- **Popular places** — full unclustered attractions + restaurants list (re-sort of already-fetched data, zero extra calls).
- **Popular-place filters** — switch between all places, attractions, and restaurants without another API request.
- **Transport hints** — itinerary legs show a practical suggestion based on straight-line distance: walk, walk or taxi, or taxi/local transport.
- **Live prices badge** — results show `● Live prices`. Caching is OFF by default (flight/hotel prices change constantly), so every search is fresh — see [quota notes](#quota-notes-no-price-cache).

### Optional enrichments (each isolated — failure only omits its field, never a 502)

| Feature | Engine | Behavior |
|---|---|---|
| **Weather snapshot** | `google` (`q=weather in X`) | Current conditions (temp, unit, condition, humidity, wind, precipitation, icon, observed time). **Explicitly labeled "Right now — not a forecast for your travel dates."** |
| **Local events** | `google_events` (`q=events in X`) | Up to 8 events with title, date, venue, description (200-char cap), link. Filtered to the trip window (month/day match — Google gives no year); undated/out-of-window events dropped. `[]` on failure/unsupported plan. |
| **Exchange-rate note** | `google_finance` (`q=FROM-TO`, e.g. `INR-GBP`) | International trips only (origin vs destination country via offline airport data; skipped for domestic/same-currency). Returns `{rate, from_currency, to_currency}`. |

### App / UX features

- **Build-your-trip form** — From / To (swap-route button), date-range picker with return-after-departure validation, travelers (1–9), budget (₹, step 1000), sensible defaults (`DEL → Goa, 2026-10-10 → 2026-10-13, 2 travelers, ₹60,000`), "Always fetch fresh results" (`force_refresh`) checkbox.
- **Demo Mode** — "Try demo trip (no key needed)" loads a saved Goa plan via `GET /api/demo` (bundled demo plan, zero SerpApi calls, zero key). Judges see the full UI even with dead quota; results carry a "Demo data" chip.
- **Print / Save PDF** — results header has a Print button; `@media print` CSS hides nav/form/maps and prints a clean day-wise trip sheet (all days + know-before-you-go).
- **Natural-language input** — type *"Goa under 50k next weekend, 2 people, veg food"* above the form → `POST /api/parse-trip` fills origin/destination/dates/travelers/budget/mode. Heuristic offline parser always works; Groq refines when `GROQ_API_KEY` is set. Food hints (`veg`/`jain`/`halal`) are detected and shown; gibberish returns `422` with an example.
- **Travel modes** — Saver, Balanced, and Comfort ranking modes. Each mode ranks already-fetched flight × hotel combinations differently without extra SerpApi quota.
- **Know before you go** — 1× `google` search (visa/entry, best time, safety) with source links, omitted on failure.
- **Destination vlogs** — top-3 YouTube results via 1× `youtube` search, omitted on failure.
- **Smart options** — ranked alternatives, a what-if budget slider, a weather-aware packing list, a live-price label, and share support.
- **Best-match card** — total, % of budget with progress bar, over/under messaging, "Why we picked this trip" reasons + insight, flight & hotel cards (per-person price, nightly × nights math, rating stars, hotel→Google-Maps link).
- **Budget bar + sticky budget summary** — visual flight/hotel/total split that stays visible while scrolling results.
- **Destinations** — 6 curated cards (Goa, Jaipur, Manali, Mumbai, Delhi, London) with photo, story, season, starting price, on both the home page and a full `/destinations` page. **"Plan this trip" prefills the planner** and scrolls to it.
- **Landing story** — Hero, How-it-works, Budget showcase, Sample trip, Benefits, About, CTA sections (hidden while results show).
- **Coastal Explorer theme** — consistent shell cream, ocean teal, seafoam, and coral visual system across the app.
- **Loading progress + helpful empty state** — animated searching state; on error, "No trips found" card with the actual error plus recovery hints (raise budget / change dates / nearby destination).
- **Responsive + accessible + system dark mode** — mobile-first Tailwind layout, semantic labels, `role=tablist` days, focus rings, aria-live map status. Dark theme follows the OS setting (no toggle); map tiles intentionally stay light in both themes.
- **Comfort-focused visual system** — responsive planner steps, tappable travel-mode cards, readable AI answers, weather context chips, Coastal Explorer colors, paper-grid travel texture, and mobile overflow protection.
- **Standalone endpoints** — `/api/flights`, `/api/hotels`, `/api/places` for debugging each leg independently (each supports `force_refresh`).
- **Groq itinerary assistant** — AI panel on results ("Ghumi Ghumi AI"). Ask about the cheapest flight in your plan, a less tiring day, weather-aware changes, packing, or food near your stops — it answers from your trip's real numbers (flight prices, budget, itinerary, weather), never invented. The core planner still works without Groq.
- **Assistant guardrails (trip-only use)** — `POST /api/assistant` is fenced so the server-side Groq key can't be repurposed: per-IP rate limit (15 requests / 10 min → `429`), a regex pre-filter that rejects prompt-injection / code / homework / poetry attempts before any Groq call (`400`, zero cost), and a scope-locked system prompt that refuses anything outside the current trip with a one-line redirect. The key never leaves the server.
- **Resilient SerpApi photos** — shared `SafeImage` component used for place cards, flight/hotel photos, vlog thumbnails, and the weather icon: sends no `Referer` (fixes Google's `lh3.googleusercontent.com` hotlink 403s) and swaps any still-dead URL for a themed placeholder instead of a broken-image icon.

---

## How it works

```
User form ──POST /api/plan──▶ Spring Boot (Java 17)
                                 ├─ 1× google_flights  (origin→destination, dates, INR)
                                 ├─ 1× google_hotels   (destination, check-in/out, travelers, INR)
                                 ├─ budget match (pure fn) ──▶ best_pick + hotel_options[5]
                                 ├─ 2× google_maps     (attractions + restaurants near winning hotel)
                                 ├─ itinerary cluster  (pure fn, hotel-seeded, 3/day)
                                  ├─ [optional] weather │ events │ FX rate │ know │ videos (each try/except'd)
                                 └─ JSON ──▶ React: PickCard → BudgetBar → Map → Itinerary → Extras
```

Core plan = **exactly 4 SerpApi searches** (1 + 1 + 2). Optionals add at most 5 more (weather, events, FX, know, videos), each silently omitted on failure.

The result page then adds local, zero-quota enhancements: travel-mode alternatives, budget simulation, packing guidance, place filters, transport hints, sharing, and the optional Groq assistant.

---

## SerpApi engines used (and why)

| Engine | Where | Why this engine |
|---|---|---|
| `google_flights` | `POST /api/flights`, step 1 of `/api/plan` | Live flight options (airline, price, duration, stops) for origin → destination + dates. Cheapest leg of the budget match. |
| `google_hotels` | `POST /api/hotels`, step 2 of `/api/plan` | Live hotel options (name, rating, ₹/night, total) for destination + dates. Second leg of the budget match. |
| `google_maps` (`type=search`) × 2 | `POST /api/places`, steps 3–4 of `/api/plan` | Nearby attractions **and** restaurants around the winning hotel. Two calls are required by design: a query for "attractions near X" returns ~100% Tourist-attraction/Fortress/Park types with zero restaurants, and vice versa — one broad query cannot supply both sides of the itinerary. |
| `google` (weather answer box) | optional step of `/api/plan` | Current conditions for the destination. Only the `weather_result` box is accepted; averages/other box types are ignored. |
| `google_events` | optional step of `/api/plan` | Concerts/festivals during the trip window. No server-side date filter exists (only today/week/month chips), so dates are applied client-side. |
| `google_finance` (`FROM-TO` pair) | optional step of `/api/plan` | Currency context for international trips (headline `summary.extracted_price`, `graph` fallback). |
| `google` (organic results) | optional step of `/api/plan` → `know` | Know-before-you-go: visa/entry, best time, safety pointers with source links (top 5 `organic_results`). |
| `youtube` (`search_query`) | optional step of `/api/plan` → `videos` | Top-3 destination vlogs (`video_results`: title/link/thumbnail/channel/duration). |

`/api/plan` core costs exactly **4 searches** (1 + 1 + 2). No loops, no retries, no polling.

---

## Prerequisites

- Java 17 + Maven (`winget install Apache.Maven`, then reopen the terminal)
- A SerpApi key (free tier: 250 searches/mo) from https://serpapi.com/
- That's it. No Node.js needed — the built frontend ships in the repo.

---

## Quickstart

```powershell
cd Serp-Travel-Project   # this repo folder
copy .env.example .env
# open .env and set SERPAPI_API_KEY=your_key_here
# optional: set GROQ_API_KEY=your_groq_key_here for the AI assistant
cd backend-java
mvn spring-boot:run
```

Open http://localhost:8000/ — form → results.

> On macOS/Linux replace `copy` with `cp .env.example .env`; the Maven command is identical. The backend auto-loads the repo-root `.env` — no manual `export` needed.

---

## Complete usage guide

### Plan a trip (main flow)

1. Open http://localhost:8000/.
2. Fill **From** (city or code, e.g. `Delhi`, `DEL`, even `Mumbay`), **To** (e.g. `Goa`), **Dates**, **Travelers**, **Budget (₹)**.
3. (Optional) tick **"Always fetch fresh results"** to force live search for this query (`force_refresh: true`).
4. Click **Find my trip →**. Watch the loading progress; results appear below:
   - **Your trip** header — destination, date range, travelers, budget, `Within budget` / `Over budget` pill, `Live prices` badge.
   - **Best match total** — flight + hotel total, % of budget bar, remaining or over-by figure.
   - **Why we picked this trip** — insight sentence + reason bullets.
   - **Flight + Hotel cards** — airline/duration/stops, per-person price when >1 traveler; hotel nightly × nights math, rating, map link.
   - **More stays** — expand to see 5 hotel options with tier badges; clicking one rebuilds the trip around it (places + itinerary re-anchor; "Updating trip…" shows while recomputing).
    - **Budget bar**, **exchange-rate note** (international only), **ways to reduce the cost** (over-budget only), **current conditions**, **popular places**, **day-by-day itinerary with map**, **events**, **know before you go** + **destination vlogs** (when their optional fetches succeed).
   - **Smart options** — compare Saver/Balanced/Comfort alternatives, test a different budget, view a weather-aware packing list, and share the trip summary.
   - **Ask about your trip (Ghumi Ghumi AI)** — ask for the cheapest flight in your plan, a less tiring day, indoor alternatives, or packing advice. It answers from your plan's real numbers. Quick suggestion chips included; non-trip requests are declined by the guardrails below.
   - **Sticky section nav + Print** — a sticky `Overview / Cost / AI guide / Itinerary / Good to know / Vlogs` navigator stays visible over long results; the **Print / Save PDF** button exports a clean day-wise trip sheet.

### Use the itinerary + map

- **Day tabs** (`Day 1`, `Day 2`, …) switch the detail list; the map highlights the active day (others stay visible as dots).
- **Map controls**: `Whole trip` shows every day color-coded; `Selected day` isolates the active tab; `Reset view` re-fits all stops. The **legend doubles as navigation** — click `Day N` to jump tabs. Badge numbers = visit order; line chips = straight-line km between consecutive stops.
- Each day subtitle shows `~X.X km between stops` (haversine sum, same formula front and back).

### Browse destinations

- Home-page cards or header **Destinations** link → full page with 6 places, season, and starting price. **Plan this trip** fills the home form's destination and scrolls to it (other fields untouched).

---

## API reference

| Method | Path | Body |
|---|---|---|
| POST | `/api/flights` | `{origin, destination, departure_date, return_date?, travelers?, force_refresh?}` |
| POST | `/api/hotels` | `{destination, check_in, check_out, travelers?, force_refresh?}` |
| POST | `/api/places` | `{location, category: "attractions" \| "restaurants", force_refresh?}` |
| POST | `/api/plan` | `{origin, destination, departure_date, return_date, travelers?, budget, force_refresh?, selected_hotel_name?, travel_mode?}` |
| POST | `/api/assistant` | `{destination, dates?, request, itinerary?, weather?, trip_prices?}` — trip-only; `400` off-topic, `429` over 15 reqs/10 min per IP |
| GET | `/api/demo` | — (saved Goa plan, no key needed) |
| POST | `/api/parse-trip` | `{text}` → `{fields: {origin?, destination?, departure_date?, return_date?, travelers?, budget?, travel_mode?, diet?}}` |
| GET | `/api/health` | — |

Status codes: `200` (+ `from_cache` / `live_search` flags), `400` unknown city / bad category / unknown pinned hotel / off-topic assistant request, `404` no flights or hotels found, `422` unparseable natural-language trip or failed request validation, `429` assistant rate limit (15 reqs/10 min per IP), `502` SerpApi failure with a friendly message (missing key, invalid key, quota, transient), `503` assistant without `GROQ_API_KEY`.

Example plan request:

```powershell
curl -Method POST http://localhost:8000/api/plan `
  -ContentType "application/json" `
  -Body '{"origin":"DEL","destination":"Goa","departure_date":"2026-10-10","return_date":"2026-10-13","travelers":2,"budget":60000}'
```

Re-plan around a specific hotel (name must be one of the trip's `hotel_options`):

```powershell
curl -Method POST http://localhost:8000/api/plan `
  -ContentType "application/json" `
  -Body '{"origin":"DEL","destination":"Goa","departure_date":"2026-10-10","return_date":"2026-10-13","travelers":2,"budget":60000,"selected_hotel_name":"Taj Resort"}'
```

---

## Example plan response

```jsonc
{
  "origin": "DEL",
  "destination": "Goa",
  "departure_date": "2026-10-10",
  "return_date": "2026-10-13",
  "travelers": 2,
  "budget": 60000,
  "num_nights": 3,
  "fits_budget": true,
  "best_pick": {
    "flight": { "airline": "IndiGo", "price": 12400, "price_per_person": 6200, "duration": "2h 35m", "stops": 0 },
    "hotel": { "name": "Taj Resort", "rating": 4.5, "price_per_night": 9000, "total_price": 27000 },
    "total_cost": 39400
  },
  "remaining_budget": 20600,
  "other_options": [ "...up to 4 more fitting combos..." ],
  "hotel_options": [ { "name": "Taj Resort", "tier": "Mid-range", "...": "..." } ],
  "selected_hotel_name": null,
  "itinerary": [ { "day": 1, "places": [ "...3 max..." ], "distance_km": 4.2 } ],
  "places": [ "...all attractions + restaurants..." ],
  "events": [ { "title": "...", "date": "...", "venue": "...", "description": "...", "link": "..." } ],
  "weather": { "temperature": "31", "unit": "Celsius", "condition": "Partly cloudy" },
  "know": [ { "title": "...", "link": "...", "snippet": "..." } ],   // omitted on failure
  "videos": [ { "title": "...", "link": "...", "thumbnail": "...", "channel": "...", "duration": "..." } ],   // omitted on failure
  "exchange_rate": null,   // present only for international trips, e.g. {"rate": 109.42, ...}
  "suggestions": null,     // present only when over budget
  "insight": "Comfortable fit — ₹20,600 to spare, and your stops average 4.3★.",
  "counts": { "flights": 12, "hotels": 15, "attractions": 20, "restaurants": 20 },
  "live_search": true
}
```

Field notes: `weather`/`know`/`videos` are omitted on failure; `events` is always present (`[]` when none/unsupported); `suggestions` only when `fits_budget` is false; `selected_hotel_name` is `null` for auto-pick.

---

## How the budget algorithm works

(`backend-java/.../service/BudgetService.java` — pure functions, no I/O)

```
for each flight × hotel:
    total = flight.price + hotel.total_price   # hotel.total_price = nightly × nights
    if total <= budget: candidates.append(...)
sort candidates by total ascending
best = candidates[0] if any
else: best = cheapest overall + flag over_by = total - budget
```

Travel modes only change ranking (`saver` = cheapest first, `comfort` = highest-rated first, `balanced` = cost + stops + rating penalty) — never new prices or API calls.

Over-budget gap-closers (same file): cheapest-hotel swap, cheapest-flight swap (≤ current stops), and one-fewer-night math — sorted by savings, top 2, with honest "closes the gap / only reduces it" wording.

---

## How the itinerary builder works

(`backend-java/.../service/ItineraryService.java` — pure functions, no I/O)

1. Interleave attractions/restaurants (attraction, restaurant, attraction…) and cap at `nights × 3`.
2. Hold coord-less places aside (appended to shortest days at the end, never breaking clustering).
3. **Seed** Day 1 from the place closest to the winning hotel; later days from the first remaining place.
4. **Grow** each day by greedy nearest-neighbor (haversine) up to 3 stops.
5. **Mix fix**: if a day lacks restaurants or attractions and the pool can supply it, swap the day's farthest same-category stop for the nearest unused place of the missing category.
6. Overflow leftovers pack onto shortest days; each day gets `distance_km` (consecutive-leg haversine sum, 1 decimal).

Why greedy, not optimal routing: full TSP/VRP is O(n!) per day and needs road-network distances — overkill for "stops that look sensibly grouped on a map." Greedy is O(D·P²) on ~40 places: trivial and visually compact.

---

## Quota notes (no price cache)

Caching is **OFF by default** (`USE_CACHE=false`): flight/hotel prices change constantly, so every search is live and the results badge always reads `● Live prices`. (The file-cache code is still in the backend and can be re-enabled with `USE_CACHE=true`, but the default is fresh prices.)

- `/api/plan` core uses exactly 4 searches (1 flights + 1 hotels + 2 places). No loops/retries. Optionals add ≤5, each independently omitted on failure.
- **Negative backoff for optional engines**: a live failure (e.g. `google_events` unsupported on your plan, quota blip) is remembered in-memory per-params for 6h so repeats skip the doomed call (zero quota) and degrade to omitted/`[]`. Success clears the entry.
- Free tier = 250 searches/mo ≈ 25–30 full plans. Watch for `quota reached` errors near the limit.
- Server logs mark every fetch: `[live API]`, `[force live]`, `[backoff]` (`[cache HIT]` only appears if caching is re-enabled).

---

## Configuration

Copy `.env.example` → `.env` (repo root — the backend loads it automatically, no `export` needed):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SERPAPI_API_KEY` | yes | — | SerpApi key from https://serpapi.com/ |
| `GROQ_API_KEY` | no | — | Groq key from https://console.groq.com/keys |
| `GROQ_MODEL` | no | `openai/gpt-oss-20b` | Model used by `/api/assistant` and `/api/parse-trip` refinement |
| `SERPAPI_TIMEOUT_SECONDS` | no | `20` | Cap per live SerpApi call so a stalled provider can't hang the app (min 5) |
| `USE_CACHE` | no | `false` | `true` = reuse local JSON cache (stale prices possible) |
| `PORT` | no | `8000` | Server port (`server.port=${PORT:8000}`) |

Never commit `.env` (already in `.gitignore`).

After adding `GROQ_API_KEY` to `.env`, restart the backend and open a completed trip. The **Ghumi Ghumi AI** panel sends the itinerary, dates, destination, current weather, and the trip's real flight/budget numbers to the assistant. The key is never sent to the browser. If an older unavailable model is left in `GROQ_MODEL`, the backend falls back to `openai/gpt-oss-20b`.

---

## Repo layout

```
backend-java/
  pom.xml                      # Spring Boot 3.2.5 + Java 17 build
  src/main/java/com/ghoomlo/
    GhoomLoApplication.java    # entry point + .env loader
    controller/                # /api/* routes: Plan, Flight, Hotel, Place, Assistant, Parse (+demo), Health
    dto/                       # request records with validation (422 on violation)
    service/                   # Budget, Itinerary, Insight, NlParse, AirportResolver, FileCache
    client/                    # SerpApiClient (fetchers + parsers + backoff), GroqClient
    config/                    # WebClient beans, CORS, DotEnv loader, frontend static mount
  src/main/resources/
    application.properties     # port, keys, timeouts (no secrets — all from .env/env)
    airports.json              # 7,884-airport offline dataset
    demo_goa.json              # Demo-Mode Goa plan (served by GET /api/demo, zero quota)
  src/test/java/com/ghoomlo/   # ParityTest + HealthTest (mvn test)
frontend-react/
  src/
    App.jsx              # plan/loading/error state, hotel re-plan, theme, hash routing
    components/          # TripForm, NaturalLanguageInput, GhumiGhumiAI, PickCard, BudgetBar,
                         # StickyBudgetSummary, ItinerarySection/Day/Map, PopularPlaces,
                         # EventsSection, WeatherSnapshot, ExchangeRateNote, SavingsSuggestions,
                         # SmartOptions, KnowBeforeYouGo, DestinationVlogs,
                         # PrintTripButton, PrintableTrip (print-only), SafeImage (photo fallback),
                         # Destinations(+Page), Hero, HowItWorks, BudgetShowcase,
                         # SampleTrip, Benefits, About, CtaSection, Header, Footer, ...
    lib/                 # router (hash), destinations catalogue, format, geo, reasons
    assets/destinations/ # Goa, Jaipur, Manali, Mumbai, Delhi, London photos
  dist/              # committed production build — this is what the backend serves
.env.example  README.md
```

---

## Frontend development (optional — only if you modify the React UI)

Running the app never needs Node. These commands are only for changing the UI:

```powershell
cd frontend-react
npm install          # one-time setup
npm run dev          # local dev with hot reload (proxies /api to localhost:8000)
npm run build        # regenerate dist/
```

The committed `frontend-react/dist/` folder is what the backend serves — always run `npm run build` after any frontend change, including right before final submission.

Tech: React 19 + Vite 8 + Tailwind 3 + Leaflet 1.9 (OSM tiles) + lucide-react icons. Dev proxy (`vite.config.js`) forwards `/api/*` to `localhost:8000`; production needs no proxy (same-origin static mount).

---

## Tests

```powershell
cd backend-java
mvn test   # 11 tests: pure-function parity + MockMvc contract tests
```

| Test | What it checks |
|---|---|
| `ParityTest.resolverParity` | city→airport (codes, overrides, Goa/GOA, typos, garbage) + country lookup |
| `ParityTest.difflibMatchesPython` | fuzzy ratios match CPython `difflib` exactly |
| `ParityTest.cacheKeyMatchesPython` | cache-key JSON/hash byte-identical to Python's `json.dumps` |
| `ParityTest.budgetParity` | best-combination, 3 mode alternatives, over-budget suggestions |
| `ParityTest.itineraryParity` | day clustering shape + `distance_km` |
| `ParityTest.nlParseParity` | heuristic parse + budget-context fallback |
| `ParityTest.insightParity` | insight sentence content |
| `HealthTest.*` | `/api/health`, parse-trip `422`, frontend `/` serving, assistant off-topic guard (`400`, zero Groq cost) |

---

## Troubleshooting

- `SERPAPI_API_KEY is missing` → you forgot the `.env` step.
- `invalid API key` → check the key at serpapi.com dashboard.
- `quota reached` → free tier exhausted (remember: no cache, so every plan burns ~4–9 searches).
- `No flights found` → check dates/airports; an unknown city returns a 400 naming it instead of searching. Flights accept airport codes (DEL) or city names — resolved automatically via offline airport data, covering essentially any city worldwide, not just a hardcoded list.
- `No hotels found` → try a broader destination name (`Goa` beats a tiny village).
- `Map unavailable` → tile network blocked; the itinerary list below still works.
- Weather/events/FX section missing → that optional fetch failed or doesn't apply (domestic trip, no answer box, unsupported engine) — core trip is unaffected by design. Same for know-before-you-go / vlogs sections.
- `Groq is not configured yet` (assistant, `503`) → add `GROQ_API_KEY` to `.env` and restart; the core planner works without it.
- `Too many assistant requests` (`429`) → per-IP limit is 15 requests / 10 min; wait and retry.
- Assistant refuses a flight/budget question → make sure the backend is restarted after updating (the scope + `trip_prices` grounding needs the latest build).
- `Couldn't understand that` (parse-trip, `422`) → rephrase plainly, e.g. `Goa under 50k next weekend, 2 people`.
- Port in use → set `PORT=8001` in `.env` and restart (update dev proxy only if using `npm run dev`).
- Frontend changes not visible at `localhost:8000` → you edited `src/` but forgot `npm run build`; the server serves `dist/`.
