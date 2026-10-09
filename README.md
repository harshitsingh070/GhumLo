# GhoomLo (घूम लो) — Intelligent Budget-First Travel Planner

> **SerpApi India Hackathon 2026** — *Travel & Local Discovery Track*  
> Plan complete, realistic trips within your exact budget using live Google Flights, Google Hotels, and Google Maps data powered by SerpApi.

[![Java 17](https://img.shields.io/badge/Java-17-ED8B00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.2](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SerpApi](https://img.shields.io/badge/SerpApi-10%20Engines-blue?logo=google&logoColor=white)](https://serpapi.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama%203%20%2F%20GPT--OSS-f55036)](https://groq.com/)
[![Tests](https://img.shields.io/badge/Tests-23%20Passing-success)](https://github.com/)

---

## 🧭 Overview

Planning a trip with a strict budget is exhausting. Travelers spend hours juggling 10+ tabs across flight aggregators, hotel portals, mapping tools, weather apps, and travel blogs—manually checking if their flight + hotel combinations exceed their spending limit.

**GhoomLo solves this in a single query.** Enter your origin, destination, travel dates, travelers, and spending limit (₹) — GhoomLo queries live Google Flights and Hotels via SerpApi, computes the optimal combination that fits your wallet, selects the winning hotel as a geographic anchor, clusters nearby attractions and restaurants into a balanced day-by-day itinerary, and enriches your trip with live weather, smart packing lists, local events, currency exchange rates, destination YouTube vlogs, and an AI trip assistant.

- **Zero Database, Zero Auth**: Clean, stateless, per-request architecture.
- **Judge-Ready Demo Mode**: Try full trip planning instantly without burning API quota or needing an API key via `GET /api/demo`.
- **Pre-Built Frontend**: React UI is pre-compiled and served directly by Spring Boot. **You do not need Node.js installed to run the application**—only Java 17 and Maven.

---

## ⚡ 60-Second Quickstart

### Prerequisites
- **Java 17+** and **Maven** installed (`java -version` and `mvn -version`).
- A **SerpApi API Key** from [serpapi.com](https://serpapi.com/) (free tier includes 250 searches/month).
- *(Optional)* A **Groq API Key** from [console.groq.com](https://console.groq.com/) for natural-language parsing and the Ghumi Ghumi AI assistant.

### 1. Setup Environment
```bash
# Clone the repository
git clone https://github.com/harshitsingh070/Travel-Compass.git
cd Travel-Compass

# Create your .env file
cp .env.example .env      # On Windows PowerShell: copy .env.example .env
```
Open `.env` and set your key:
```env
SERPAPI_API_KEY=your_serpapi_key_here
GROQ_API_KEY=your_groq_key_here      # Optional
```

### 2. Run the Application
```bash
cd backend-java
mvn spring-boot:run
```

### 3. Open in Browser
Navigate to **`http://localhost:8000`** in your browser.
- **Live Search**: Enter your route (e.g., `DEL` → `Goa`, 2 travelers, ₹60,000) and click **Find my trip →**.
- **Instant Demo**: Click **"Try demo trip (no key needed)"** to load a pre-computed Goa trip without consuming any API quota.

---

## 🏗️ Architecture & Orchestration Pipeline

GhoomLo employs a high-performance concurrent fan-out pipeline designed to minimize latency and guarantee quota efficiency.

```
                          User Query (Form or Natural Language)
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 0: Offline City & Airport Resolution  │
                 │   7,884 airports, zero network calls, typos   │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 1: Concurrent Core Search (2 calls)    │
                 │   ├─ 1× google_flights (origin → dest, ₹)     │
                 │   └─ 1× google_hotels (dest, dates, ₹)        │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 1.5: Pure Combinatorial Optimization   │
                 │   Evaluates all Flight × Hotel combinations   │
                 │   Applies Travel Mode (Saver/Balanced/Comfort)│
                 │   Pins Winning Hotel as Geographic Anchor     │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 2: Concurrent Places Search (2 calls)  │
                 │   ├─ 1× google_maps (attractions near hotel)  │
                 │   └─ 1× google_maps (restaurants near hotel)  │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 2.5: Greedy Geoclustering Engine       │
                 │   Interleaves attractions + dining (3/day)    │
                 │   Haversine distance summation per leg        │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │  Stage 3: Parallel Enrichments (Fail-Safe)    │
                 │   ├─ google (Live weather snapshot)           │
                 │   ├─ Weather-aware packing checklist engine   │
                 │   ├─ google_events (trip-window concerts/etc) │
                 │   ├─ google_finance (FX rate for intl trips)  │
                 │   ├─ google organic (know-before-you-go)      │
                 │   └─ youtube (top destination travel vlogs)   │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
                      Unified JSON Payload ──▶ React Dashboard
```

> **Quota Guarantee:** A full trip plan consumes **exactly 4 core SerpApi searches** (1 flights + 1 hotels + 2 maps). Optional enrichments run concurrently in isolated try-catch blocks with fast timeouts (8s) and never cause a 502 error if one fails.

---

## 🔍 SerpApi Engines Matrix

GhoomLo integrates **10 distinct SerpApi engines & query targets**, choosing each deliberately for maximum data fidelity:

| Engine | Query / Parameters | Why This Engine? | Quota & Resilience |
|---|---|---|---|
| `google_flights` | `engine=google_flights`, `departure_id`, `arrival_id`, `outbound_date`, `return_date`, `currency=INR` | Provides live flight prices, airline names, durations, layover stops, and departure/arrival hubs. | 1 call per plan. Unresolvable cities fail early before calling API. |
| `google_hotels` | `engine=google_hotels`, `q={dest}`, `check_in_date`, `check_out_date`, `adults`, `currency=INR` | Live nightly hotel pricing, guest ratings, reviews count, property tokens, amenities, and GPS coordinates. | 1 call per plan. Cheapest options sorted and extracted. |
| `google_maps` *(Attractions)* | `engine=google_maps`, `type=search`, `q=attractions near {Hotel}, {Dest}` | Yields curated sightseeing spots, heritage sites, and parks anchored directly around where the traveler stays. | 1 call per plan. Anchored to winning hotel coordinates. |
| `google_maps` *(Restaurants)* | `engine=google_maps`, `type=search`, `q=restaurants near {Hotel}, {Dest}` | Discovers authentic local dining, cafes, and eateries around the accommodation. | 1 call per plan. Kept separate from attractions to ensure balanced itineraries. |
| `google` *(Weather Box)* | `engine=google`, `q=weather in {Dest}` | Extracts current temperature, precipitation, humidity, wind conditions, and condition icons from the `weather_result` answer box. | 1 optional call. Powers the rule-based packing checklist. |
| `google_events` | `engine=google_events`, `q=events in {Dest}` | Finds festivals, live music, exhibitions, and cultural happenings matching the user's travel dates. | 1 optional call. Client-side filtered to the exact travel window. |
| `google_finance` | `engine=google_finance`, `q={FROM-TO}` (e.g., `INR-GBP`) | Provides live foreign exchange rates and conversion context for international trips. | 1 optional call. Automatically triggered only when origin and destination countries differ. |
| `google` *(Organic)* | `engine=google`, `q=travel guide visa best time safety {Dest}` | Surfaces practical travel advice, visa requirements, best visiting months, and safety tips with trusted source URLs. | 1 optional call. Parsed from top 5 organic results. |
| `youtube` | `engine=youtube`, `search_query={Dest} travel vlog guide` | Pulls top-3 cinematic travel vlogs with video titles, channel names, duration, and high-res thumbnails. | 1 optional call. Gives users immediate visual inspiration. |
| `google_hotels` / `google_maps_reviews` | `property_token` or `place_id`/`data_id` via `/api/*/reviews` | Lazy on-demand expansion of traveler reviews when clicking hotel or place cards. | **0 quota on initial plan.** Triggered only on user card expansion (cached 24h). |

---

## ✨ Feature Breakdown

### 1. Smart Budget Matching & Optimization
- **Combinatorial Evaluation**: Prices every valid `flight × hotel` pairing (`flight.price + (hotel.nightly × nights)`).
- **Travel Modes**:
  - **Saver**: Prioritizes lowest overall spend.
  - **Balanced**: Balances budget, flight stops, and hotel ratings.
  - **Comfort**: Prioritizes highest hotel ratings and non-stop flights within budget.
- **Interactive Hotel Re-Planning ("More Stays")**: Displays top hotel alternatives categorized into dynamic price tertiles (`Budget`, `Mid-range`, `Higher-end` calculated from that city's live price range). Selecting a stay automatically re-anchors the places search and itinerary around that hotel.
- **Over-Budget Gap Closers**: If no option fits the user's budget, GhoomLo surfaces the best possible trip marked `fits_budget: false`, displays `over_by: ₹X`, and calculates up to 2 data-backed savings suggestions (e.g., swapping to a cheaper hotel, opting for a 1-stop flight, or reducing the trip by 1 night).
- **What-If Budget Slider**: Interactive slider on results to test alternative budgets without making new API requests.

### 2. Proximity-Clustered Itinerary & Interactive Map
- **Greedy Nearest-Neighbor Clustering**: Day 1 seeds from the attraction closest to the winning hotel. Subsequent stops are added based on shortest Haversine distance, guaranteeing realistic routes.
- **Balanced Daily Mix**: Enforces a maximum of 3 stops per day and ensures every day includes both sightseeing and dining options.
- **Transit Hints & Leg Distances**: Calculates straight-line distance (`km`) between consecutive stops and suggests practical transit advice (e.g., "Short walk ~400m", "Quick auto/taxi ~2.1 km").
- **Custom Interactive Leaflet Map**:
  - Distinct colored routes for each day.
  - Special `H` pin for the hotel anchor.
  - Numbered stop badges in chronological order.
  - Whole-trip vs. single-day view toggles.
  - Clickable interactive legend acting as day navigation.
  - Zero external icon dependencies (built with pure CSS/HTML divIcons to eliminate 404 asset bugs).

### 3. Offline Global Airport Resolution (7,884 Airports)
- **Zero-Quota Offline Dataset**: 7,884 global airports bundled in backend JSON.
- **Smart Typo Tolerance**: Difflib string-similarity matching handles misspellings (`lucnknow` → `LKO`, `Mumbay` → `BOM`, `Jaipor` → `JAI`).
- **Hub & Region Aliasing**: Maps common regions and vacation spots to their nearest airport hubs (`Goa` → `GOI`, `Bali` → `DPS`, `Phuket` → `HKT`, `Manali` → `KUU`, `Maldives` → `MLE`, `Dubai` → `DXB`).
- **AI Airport Fallback**: Obscure locations are resolved via Groq AI and strictly validated against the offline database before touching flight search.

### 4. Weather-Aware Dynamic Packing List
- **Rule-Based Engine**: Consumes the live SerpApi weather snapshot (`temperature`, `precipitation`, `wind`, `humidity`) alongside trip duration and group size.
- **Transparent Reasoning**: Every generated checklist item includes a clear explanation (e.g., *"Rain jacket — 70% precipitation reported in destination"*, *"Power bank — 3 full outdoor itinerary days"*).

### 5. Natural Language Trip Parsing (`POST /api/parse-trip`)
- Type free-form text: *"Goa next weekend under 50k for 2 people with veg food"*
- Dual-layer parsing: fast regex/heuristic extraction works 100% offline; Groq AI refines ambiguous queries when configured.
- Automatically detects origin, destination, relative dates, traveler count, budget, travel mode, and dietary requirements (`veg`, `jain`, `halal`).

### 6. Ghumi Ghumi AI Assistant (Groq-Powered)
- **Trip-Grounded Context**: An embedded AI panel answers questions about your specific trip using actual numbers (flight schedules, remaining budget, itinerary stops, and live weather).
- **Three-Tier Security Guardrails**:
  1. *Edge Rate Limiting*: 15 requests per 10 minutes per IP.
  2. *Regex Injection Filter*: Blocks prompt injection, code generation, homework, or poetry queries before hitting Groq (`HTTP 400`, zero LLM cost).
  3. *Scope-Locked System Prompt*: Strictly declines off-topic queries and redirects to trip details.

### 7. Export, Print & Sharing
- **Print / Save as PDF**: Clean `@media print` CSS strips out navigation, search forms, and interactive widgets to produce an executive day-wise travel summary.
- **JSON Export**: Download complete trip data as structured JSON.
- **Native Share Support**: Uses Web Share API (with clipboard fallback) to generate formatted WhatsApp/SMS-ready trip itineraries.

---

## 📡 API Reference

All endpoints return JSON and are rooted at `/api/*`.

| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `POST` | `/api/plan` | `{origin, destination, departure_date, return_date, travelers, budget, force_refresh?, selected_hotel_name?, travel_mode?}` | Core orchestrator: flights, hotels, budget matching, places, itinerary & enrichments. |
| `POST` | `/api/flights` | `{origin, destination, departure_date, return_date?, travelers?, force_refresh?}` | Standalone flight search via SerpApi Google Flights. |
| `POST` | `/api/hotels` | `{destination, check_in, check_out, travelers?, force_refresh?}` | Standalone hotel search via SerpApi Google Hotels. |
| `POST` | `/api/places` | `{location, category: "attractions" \| "restaurants", force_refresh?}` | Standalone places search via SerpApi Google Maps. |
| `POST` | `/api/parse-trip` | `{text: string}` | Natural-language query parser (extracts route, dates, budget, diet). |
| `POST` | `/api/assistant` | `{destination, request, itinerary?, weather?, trip_prices?}` | Groq-powered trip-grounded assistant with security guardrails. |
| `POST` | `/api/hotels/reviews`| `{property_token: string, force_refresh?}` | On-demand hotel review expansion (cached 24h). |
| `POST` | `/api/places/reviews`| `{place_id?: string, data_id?: string, force_refresh?}` | On-demand place review expansion (cached 24h). |
| `GET` | `/api/demo` | *None* | Returns pre-computed Goa trip instantly (0 SerpApi quota, no key needed). |
| `GET` | `/api/health` | *None* | Health check endpoint returning server status. |

### Sample Plan Request
```bash
curl -X POST http://localhost:8000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "DEL",
    "destination": "Goa",
    "departure_date": "2026-10-10",
    "return_date": "2026-10-13",
    "travelers": 2,
    "budget": 60000,
    "travel_mode": "balanced"
  }'
```

### Sample Response Snippet
```json
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
    "flight": {
      "airline": "IndiGo",
      "price": 12400,
      "price_per_person": 6200,
      "duration": "2h 35m",
      "stops": 0
    },
    "hotel": {
      "name": "Taj Fort Aguada Resort",
      "rating": 4.6,
      "price_per_night": 9500,
      "total_price": 28500
    },
    "total_cost": 40900
  },
  "remaining_budget": 19100,
  "other_options": [ ... ],
  "hotel_options": [ ... ],
  "itinerary": [
    {
      "day": 1,
      "distance_km": 3.8,
      "places": [
        { "name": "Sinquerim Beach", "type": "attraction", "lat": 15.498, "lng": 73.768 },
        { "name": "Bupati Seafood Bar", "type": "restaurant", "lat": 15.501, "lng": 73.769 }
      ]
    }
  ],
  "weather": { "temperature": "30", "unit": "Celsius", "condition": "Sunny" },
  "packing": [ ... ],
  "events": [ ... ],
  "know": [ ... ],
  "videos": [ ... ],
  "insight": "Comfortable fit — ₹19,100 to spare, and your stops average 4.5★.",
  "live_search": true
}
```

---

## ⚙️ Configuration (.env)

The backend automatically loads `.env` from the project root upon startup.

| Environment Variable | Required | Default | Description |
|---|---|---|---|
| `SERPAPI_API_KEY` | **Yes** | — | Your API key from [serpapi.com](https://serpapi.com/). |
| `GROQ_API_KEY` | No | — | Your API key from [console.groq.com](https://console.groq.com/) for AI features. |
| `GROQ_MODEL` | No | `openai/gpt-oss-20b` | Model used for Ghumi Ghumi AI and NL trip parsing. |
| `PORT` | No | `8000` | Port for the Spring Boot server. |
| `USE_CACHE` | No | `false` | `false` ensures 100% fresh live pricing. Set to `true` to reuse local file cache. |
| `SERPAPI_TIMEOUT_SECONDS` | No | `20` | Max timeout per core SerpApi call (seconds). |
| `SERPAPI_TIMEOUT_OPTIONAL_SECONDS`| No | `8` | Fast fail-safe timeout for optional enrichments. |
| `CORS_ALLOWED_ORIGINS` | No | *(empty)* | Comma-separated allowed origins (e.g., `http://localhost:5173`). Empty defaults to same-origin. |
| `TRUST_PROXY_HEADERS` | No | `false` | Enable `X-Forwarded-For` inspection when deploying behind a trusted reverse proxy. |

---

## 🛡️ Reliability & Security Engineering

- **Fail-Early Validation**: Invalid date ranges, negative budgets, or reversed dates trigger `HTTP 422 Unprocessable Entity` before invoking any SerpApi or Groq call, strictly protecting your API quota.
- **Negative In-Memory Backoff**: If an optional search (e.g. `google_events` or currency exchange) fails due to plan limits or transient upstream hiccups, failure state is remembered for 6 hours. Subsequent requests degrade gracefully to `[]` without wasting quota.
- **Hotlink Protection for SerpApi Images**: The frontend `SafeImage` component strips `Referer` headers to circumvent Google CDN hotlink `403 Forbidden` responses and provides fallback assets.
- **Edge Rate Limiting**: Built-in sliding window rate limiter protects server resources:
  - Search endpoints: max 30 requests / 10 minutes per IP.
  - Assistant endpoint: max 15 requests / 10 minutes per IP.
  - Parse endpoint: max 60 requests / 10 minutes per IP.

---

## 🧪 Automated Test Suite

The backend contains **23 automated tests across 5 comprehensive test suites**, verifying algorithm parity, security defenses, CORS policies, and health contracts:

```bash
cd backend-java
mvn test
```

| Test Suite | Tests | Verification Scope |
|---|---|---|
| `ParityTest` | 9 | Airport resolution, difflib fuzzy algorithms, cache hashing, budget matching, travel modes, itinerary clustering, NL parser, insight generator. |
| `SecurityTest` | 6 | Edge validation (422 without external calls), prompt-injection mitigation, rate limit enforcement, honest budget calculation. |
| `ServiceUnitTest` | 4 | Unit verification of budget service, itinerary building, insight rules, and packing engine. |
| `CorsTest` | 2 | Same-origin default enforcement and custom origin headers. |
| `HealthTest` | 2 | `/api/health` availability and static frontend asset delivery verification. |

---

## 📁 Repository Structure

```
Serp-Travel-Project/
├── .env.example                     # Environment template with documented keys
├── README.md                        # Project documentation & evaluation guide
├── backend-java/                    # Production Spring Boot 3.2.5 Backend
│   ├── pom.xml                      # Maven project configuration (Java 17)
│   ├── src/main/java/com/ghoomlo/
│   │   ├── GhoomLoApplication.java  # Application entrypoint & .env bootstrap
│   │   ├── client/                  # SerpApiClient, GroqClient, WebClient beans
│   │   ├── config/                  # CORS, rate limiting, static asset mount
│   │   ├── controller/              # REST controllers (/api/plan, /api/flights, etc.)
│   │   ├── dto/                     # Strongly-typed Java records with Bean Validation
│   │   └── service/                 # Budget, Itinerary, Packing, Airport, Insight services
│   ├── src/main/resources/
│   │   ├── application.properties   # Property configuration
│   │   ├── airports.json            # 7,884 global airport offline database
│   │   └── demo_goa.json            # Pre-computed Goa plan for Demo Mode
│   └── src/test/java/com/ghoomlo/   # 23 automated regression & security tests
└── frontend-react/                  # React 19 + Tailwind CSS + Leaflet Frontend
    ├── package.json                 # Node dependencies (dev-only)
    ├── vite.config.js               # Vite build config with /api proxy
    ├── dist/                        # Pre-compiled static assets served by Spring Boot
    └── src/
        ├── App.jsx                  # Main router, state coordinator, and theme holder
        ├── components/              # 40+ modular UI components:
        │   ├── TripForm.jsx         # Origin/destination route selector & budget inputs
        │   ├── PickCard.jsx         # Best match flight + hotel card & more stays picker
        │   ├── ItinerarySection.jsx # Day tabs & chronological stop schedule
        │   ├── ItineraryMap.jsx     # Interactive Leaflet map with custom HTML markers
        │   ├── SmartOptions.jsx     # Travel mode comparison & what-if budget slider
        │   ├── GhumiGhumiAI.jsx     # Grounded AI travel assistant drawer
        │   ├── PackingList.jsx      # Weather-driven packing checklist
        │   ├── PrintableTrip.jsx    # Clean print/PDF export sheet
        │   └── SafeImage.jsx        # Google photo fallback & referer stripper
        └── lib/                     # Geolocation math, formatting, and routing utilities
```

---

## 🎨 Frontend Development *(Optional)*

> **Note:** The compiled React bundle is already checked into `frontend-react/dist/` and served automatically by Spring Boot at `http://localhost:8000/`. You only need to run these commands if you want to modify the UI.

```bash
cd frontend-react
npm install          # Install frontend dependencies
npm run dev          # Start local Vite dev server with proxy to :8000
npm run build        # Compile updated UI into dist/
```

---

## 👥 Hackathon Team & Track

- **Hackathon**: [SerpApi India Hackathon 2026](https://serpapi.com/)
- **Track**: Travel & Local Discovery
- **Project**: **GhoomLo (घूम लो)** — Budget-First Travel Compass
