# GhoomLo backend-java (Spring Boot scaffold)

Maven + Java 17 port of `../backend/` (FastAPI). Scaffold only — endpoints return `Not implemented yet` until pure functions are ported.

## Run (needs Maven installed)

```powershell
cd backend-java
mvn spring-boot:run
# GET http://localhost:8000/api/health -> {"ok": true}
```

Install Maven: `winget install Apache.Maven` then reopen terminal.

## Python -> Java map

| Python | Java stub |
|---|---|
| `backend/main.py` api_plan/flights/hotels/places/assistant/parse/demo/health | `controller/*Controller.java` + `dto/*Req.java` |
| `backend/serpapi_client.py` fetch+parse+resolver | `client/SerpApiClient.java` + `service/AirportResolver.java` |
| `backend/budget.py` | `service/BudgetService.java` |
| `backend/itinerary.py` | `service/ItineraryService.java` |
| `backend/insight.py` | `service/InsightService.java` |
| `backend/nlparse.py` | `service/NlParseService.java` + `client/GroqClient.java` |
| `backend/cache.py` | `service/FileCacheService.java` |

## Notes

- No feature loss vs Python (see prior analysis). No DB/auth — stateless.
- SerpApi/Groq have no official Java SDK: plain WebClient HTTP, same params.
- airportsdata (7884 IATA) -> bundle CSV under `src/main/resources` (next step).
- `frontend-react/dist/` can later copy to `src/main/resources/static/` for same-origin serving.
