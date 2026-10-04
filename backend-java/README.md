# GhoomLo backend-java (Spring Boot)

Java 17 + Spring Boot 3.2.5 backend for GhoomLo (SerpApi trip planner). No Python — this is the only backend. Stateless, no DB/auth.

## Run

```powershell
cd backend-java
mvn spring-boot:run
# UI + API at http://localhost:8000/
# GET http://localhost:8000/api/health -> {"ok": true}
```

Install Maven: `winget install Apache.Maven` then reopen terminal.

The repo-root `.env` is auto-loaded on startup (`SERPAPI_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `USE_CACHE`, `PORT`) — no manual `export` needed. See the root README for the full docs.

## Test

```powershell
cd backend-java
mvn test   # 11 tests, all offline except key presence checks
```

## Layout

| Path | What |
|---|---|
| `controller/` | `/api/*` routes: Plan, Flight, Hotel, Place, Assistant, Parse (+demo), Health |
| `dto/` | request records with Bean Validation (failures → `422`) |
| `service/` | `BudgetService`, `ItineraryService`, `InsightService`, `NlParseService`, `AirportResolver` (difflib port), `FileCacheService` (disabled by default) |
| `client/` | `SerpApiClient` (fetchers + parsers + optional-engine backoff), `GroqClient` (assistant + NL-parse refine) |
| `config/` | WebClient beans, CORS, `DotEnv` loader, `FrontendConfig` (serves `frontend-react/dist` same-origin) |
| `src/main/resources/` | `application.properties`, `airports.json` (7,884 IATA), `demo_goa.json` (demo plan) |

## Notes

- SerpApi/Groq have no official Java SDK: plain WebClient HTTP, same params as the SerpApi docs.
- Caching is OFF by default (`USE_CACHE=false`): every search is live. Optional-engine failure backoff (in-memory, 6h) still applies.
- `/api/assistant` is trip-locked: rate limit (15/10 min per IP), regex pre-filter (`400`, zero cost), scope-locked prompt grounded in `trip_prices` context.
