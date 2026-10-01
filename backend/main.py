"""Trip Cost Compass — FastAPI backend.

Run from project root:
    pip install -r requirements.txt
    copy .env.example -> .env  (add SERPAPI_API_KEY)
    uvicorn backend.main:app --reload --port 8000

Frontend (plain HTML/CSS/JS) is served from /frontend at http://localhost:8000/
"""
import logging
import os
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

try:
    from backend.budget import (build_mode_alternatives, find_best_combination,
                                generate_savings_suggestions, rank_combinations)
    from backend.insight import generate_trip_insight
    from backend.itinerary import build_itinerary
    from backend.serpapi_client import (
        COUNTRY_CURRENCY,
        country_for_city,
        fetch_events_raw,
        fetch_exchange_rate,
        fetch_flights_raw,
        fetch_hotels_raw,
        fetch_places_raw,
        fetch_weather_snapshot,
        parse_events,
        parse_flights,
        parse_hotels,
        parse_places,
    )
except ImportError:  # running as `uvicorn main:app` from backend/
    from budget import (build_mode_alternatives, find_best_combination,
                        generate_savings_suggestions, rank_combinations)  # type: ignore
    from insight import generate_trip_insight  # type: ignore
    from itinerary import build_itinerary  # type: ignore
    from serpapi_client import (  # type: ignore
        COUNTRY_CURRENCY,
        country_for_city,
        fetch_events_raw,
        fetch_exchange_rate,
        fetch_flights_raw,
        fetch_hotels_raw,
        fetch_places_raw,
        fetch_weather_snapshot,
        parse_events,
        parse_flights,
        parse_hotels,
        parse_places,
    )

log = logging.getLogger("trip-compass")
app = FastAPI(title="Trip Cost Compass")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- models ----------------

class FlightsReq(BaseModel):
    origin: str = Field(examples=["DEL"])
    destination: str = Field(examples=["BOM"])
    departure_date: str = Field(examples=["2026-10-10"])
    return_date: str | None = Field(default=None, examples=["2026-10-13"])
    travelers: int = 1
    force_refresh: bool = False


class HotelsReq(BaseModel):
    destination: str = Field(examples=["Goa"])
    check_in: str = Field(examples=["2026-10-10"])
    check_out: str = Field(examples=["2026-10-13"])
    travelers: int = 1
    force_refresh: bool = False


class PlacesReq(BaseModel):
    location: str = Field(examples=["Goa"])
    category: str = Field(default="attractions", examples=["attractions"])
    force_refresh: bool = False


class PlanReq(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: str
    travelers: int = 1
    budget: int = Field(examples=[60000])
    force_refresh: bool = False
    # Optional: pin the hotel by exact name (must match one of the
    # trip's hotel_options). Absent = automatic best-pick selection.
    selected_hotel_name: str | None = None
    travel_mode: str = Field(default="balanced", examples=["balanced"])


class AssistantReq(BaseModel):
    destination: str = Field(min_length=1, max_length=100)
    dates: str = Field(default="", max_length=80)
    request: str = Field(min_length=2, max_length=600)
    itinerary: list[dict] = Field(default_factory=list, max_length=30)
    weather: dict | None = None


# ---------------- helpers ----------------

def _num_nights(d1: str, d2: str) -> int:
    try:
        n = (date.fromisoformat(d2) - date.fromisoformat(d1)).days
        return max(1, n)
    except ValueError:
        return 1


def _friendly_error(e: Exception) -> str:
    msg = str(e)
    low = msg.lower()
    if "api_key" in low or "missing" in low:
        return "Server API key is missing. Add SERPAPI_API_KEY to .env (see .env.example)."
    if "invalid api key" in low or "401" in low or "403" in low:
        return "SerpApi key is invalid. Check SERPAPI_API_KEY in .env."
    if "quota" in low or "429" in low or "limit" in low:
        return "SerpApi quota reached (free tier = 250 searches/mo). Try again later or reuse cached results."
    return "Search temporarily failed. Please try again in a moment."


def _hotel_tier(price_per_night: int, lo: int, span: int) -> str:
    """Budget / Mid-range / Higher-end by position in THIS destination's
    fetched hotel price range (dynamic tertiles — no hardcoded rupee
    thresholds, so it stays meaningful across cities/countries)."""
    if span <= 0:
        return "Budget"  # all fetched hotels cost the same — at the floor
    pos = (price_per_night - lo) / span
    if pos <= 1 / 3:
        return "Budget"
    if pos <= 2 / 3:
        return "Mid-range"
    return "Higher-end"


# ---------------- endpoints ----------------

@app.post("/api/flights")
def api_flights(req: FlightsReq):
    try:
        raw = fetch_flights_raw(req.origin, req.destination, req.departure_date,
                                req.return_date, req.travelers,
                                force_refresh=req.force_refresh)
        flights = parse_flights(raw, req.travelers)
        if not flights:
            return {"flights": [], "message": "No flights found for these airports/dates."}
        return {"flights": flights, "from_cache": bool(raw.get("_from_cache"))}
    except ValueError as e:
        # Unresolvable city (or missing API key): client's problem, no SerpApi
        # call was made, so no quota burned. Must stay 4xx, never 502.
        msg = str(e)
        if msg.startswith("unresolvable "):
            bad = msg.split(": ", 1)[1] if ": " in msg else "that city"
            return JSONResponse(status_code=400, content={
                "error": f"Couldn't find an airport for '{bad}' — "
                         f"try the 3-letter airport code instead (e.g. DEL, LHR, JFK)"})
        log.exception("flights failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})
    except Exception as e:
        log.exception("flights failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})


@app.post("/api/hotels")
def api_hotels(req: HotelsReq):
    try:
        nights = _num_nights(req.check_in, req.check_out)
        raw = fetch_hotels_raw(req.destination, req.check_in, req.check_out, req.travelers,
                               force_refresh=req.force_refresh)
        hotels = parse_hotels(raw, nights)
        if not hotels:
            return {"hotels": [], "message": "No hotels found for this destination/dates."}
        return {"hotels": hotels, "num_nights": nights,
                "from_cache": bool(raw.get("_from_cache"))}
    except Exception as e:
        log.exception("hotels failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})


@app.post("/api/places")
def api_places(req: PlacesReq):
    try:
        cat = req.category.lower().strip()
        if cat not in ("attractions", "restaurants"):
            return JSONResponse(status_code=400,
                                content={"error": "category must be 'attractions' or 'restaurants'"})
        raw = fetch_places_raw(req.location, cat, force_refresh=req.force_refresh)
        places = parse_places(raw, cat)
        if not places:
            return {"places": [], "message": f"No {cat} found near {req.location}."}
        return {"places": places, "from_cache": bool(raw.get("_from_cache"))}
    except Exception as e:
        log.exception("places failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})


@app.post("/api/plan")
def api_plan(req: PlanReq):
    """Orchestration: flights -> hotels -> budget match -> places -> itinerary.

    Core costs exactly 4 SerpApi searches: 1x google_flights + 1x google_hotels +
    2x google_maps (attractions + restaurants — separate calls required, see
    fetch_places_raw docstring). Pass force_refresh=true (or USE_CACHE=false)
    for a guaranteed-live demo run.

    Optional add-ons (each independently try/except'd, each cached with its
    own TTL, each omitted from the response on failure — never a 502):
      - weather    (1x google, 6h cache)   -> `weather` field, absent on failure
      - events     (1x google_events, 24h) -> `events` field, [] on failure
      - FX rate    (1x google_finance, 12h, international trips only)
                   -> `exchange_rate` field, absent for domestic/failure
    Hotel tiers and the `places` list are pure computation over data already
    fetched — zero extra quota.
    """
    try:
        nights = _num_nights(req.departure_date, req.return_date)
        fr = req.force_refresh

        raw_f = fetch_flights_raw(req.origin, req.destination,
                                  req.departure_date, req.return_date, req.travelers,
                                  force_refresh=fr)
        flights = parse_flights(raw_f, req.travelers)
        if not flights:
            return JSONResponse(status_code=404,
                                content={"error": "No flights found. Try different airports or dates."})

        raw_h = fetch_hotels_raw(req.destination, req.departure_date,
                                 req.return_date, req.travelers,
                                 force_refresh=fr)
        hotels = parse_hotels(raw_h, nights)
        if not hotels:
            return JSONResponse(status_code=404,
                                content={"error": "No hotels found. Try a broader destination name."})

        # Picker data: top-5 cheapest hotels (hotels arrive sorted by
        # total_price ascending). Informational only — auto-selection below
        # is untouched when selected_hotel_name is absent. `tier` is computed
        # from the FULL fetched price range for this destination (dynamic
        # tertiles, zero API calls) so it stays honest across cities.
        prices = [h["price_per_night"] for h in hotels]
        lo_price, hi_price = min(prices), max(prices)
        span = hi_price - lo_price
        hotel_options = [
            {"name": h["name"], "rating": h.get("rating"),
             "price_per_night": h["price_per_night"],
             "total_price": h["total_price"],
             "lat": h.get("lat"), "lng": h.get("lng"),
             "tier": _hotel_tier(h["price_per_night"], lo_price, span)}
            for h in hotels[:5]
        ]

        mode = req.travel_mode if req.travel_mode in ("saver", "balanced", "comfort") else "balanced"
        if req.selected_hotel_name:
            chosen = next((h for h in hotels
                           if h["name"] == req.selected_hotel_name), None)
            if chosen is None:
                return JSONResponse(status_code=400, content={
                    "error": f"Unknown hotel '{req.selected_hotel_name}' for this trip — "
                             f"pick one from hotel_options."})
            # Hotel pinned by the user: run the SAME pure function over a
            # single-hotel list. Minimizing flight+fixed-hotel total reduces
            # to the cheapest flight — no new budget logic, identical
            # response shape (fits_budget / best_pick / over_by / candidates).
            ranked = rank_combinations(flights, [chosen], req.budget, mode)
            selected = ranked[0] if ranked else None
            if selected:
                fits = selected["total_cost"] <= req.budget
                match = {
                    "fits_budget": fits,
                    "best_pick": selected if fits else {**selected, "over_by": selected["total_cost"] - req.budget},
                    "candidates": ranked,
                    "remaining_budget": max(0, req.budget - selected["total_cost"]),
                }
            else:
                match = find_best_combination(flights, [chosen], req.budget)
        else:
            ranked = rank_combinations(flights, hotels, req.budget, mode)
            match = find_best_combination(flights, hotels, req.budget)
            if ranked:
                selected = ranked[0]
                fits = selected["total_cost"] <= req.budget
                match = {
                    "fits_budget": fits,
                    "best_pick": selected if fits else {**selected, "over_by": selected["total_cost"] - req.budget},
                    "candidates": ranked,
                    "remaining_budget": max(0, req.budget - selected["total_cost"]),
                }
        best = match["best_pick"]
        hotel_name = best["hotel"]["name"]
        anchor = f"{hotel_name}, {req.destination}"
        hotel_lat = best["hotel"].get("lat")
        hotel_lng = best["hotel"].get("lng")

        attractions, restaurants = [], []
        raw_a: dict = {}
        raw_r: dict = {}
        try:
            raw_a = fetch_places_raw(anchor, "attractions", force_refresh=fr)
            attractions = parse_places(raw_a, "attractions")
        except Exception as e:
            log.warning(f"attractions lookup failed: {e}")
        try:
            raw_r = fetch_places_raw(anchor, "restaurants", force_refresh=fr)
            restaurants = parse_places(raw_r, "restaurants")
        except Exception as e:
            log.warning(f"restaurants lookup failed: {e}")

        itinerary = build_itinerary(attractions, restaurants, nights,
                                    hotel_lat, hotel_lng)
        any_live = not all(r.get("_from_cache")
                           for r in (raw_f, raw_h, raw_a, raw_r) if r)

        # ---- Optional add-ons: each isolated — a failure omits its field
        # ---- (or yields [] for events) and the core response still returns.
        weather = None
        try:
            weather = fetch_weather_snapshot(req.destination, force_refresh=fr)
        except Exception as e:  # belt-and-suspenders: fn already returns None
            log.warning(f"weather snapshot failed (omitted): {e}")

        events: list[dict] = []
        try:
            raw_ev = fetch_events_raw(req.destination, req.departure_date,
                                      req.return_date, force_refresh=fr)
            events = parse_events(raw_ev, req.departure_date, req.return_date)
        except Exception as e:
            log.warning(f"events lookup failed (omitted): {e}")

        exchange_rate = None
        try:
            # International only: compare origin/destination countries via the
            # airportsdata entries already loaded for airport resolution.
            origin_country = country_for_city(req.origin)
            dest_country = country_for_city(req.destination)
            if (origin_country and dest_country
                    and origin_country != dest_country):
                from_cur = COUNTRY_CURRENCY.get(origin_country)
                to_cur = COUNTRY_CURRENCY.get(dest_country)
                if from_cur and to_cur and from_cur != to_cur:
                    exchange_rate = fetch_exchange_rate(from_cur, to_cur,
                                                        force_refresh=fr)
        except Exception as e:  # fn already returns None; this is insurance
            log.warning(f"exchange rate lookup failed (omitted): {e}")

        resp = {
            "origin": req.origin, "destination": req.destination,
            "departure_date": req.departure_date, "return_date": req.return_date,
            "travelers": req.travelers, "budget": req.budget,
            "num_nights": nights,
            "fits_budget": match["fits_budget"],
            "best_pick": best,
            "remaining_budget": match["remaining_budget"],
            "other_options": match["candidates"][1:5],
            "hotel_options": hotel_options,
            "selected_hotel_name": req.selected_hotel_name,  # null = auto-pick
            "travel_mode": mode,
            "plan_alternatives": build_mode_alternatives(flights, hotels, req.budget),
            "itinerary": itinerary,
            # Full (unclustered) places list: feeds the standalone
            # "Popular places" view — a re-sort of data already fetched,
            # zero extra SerpApi calls.
            "places": attractions + restaurants,
            # Always present per spec: [] when none found or on failure.
            "events": events,
            "counts": {"flights": len(flights), "hotels": len(hotels),
                       "attractions": len(attractions), "restaurants": len(restaurants)},
            "live_search": any_live,  # true = fresh SerpApi data, false = served from file cache
        }
        if weather:
            resp["weather"] = weather
        if exchange_rate:
            resp["exchange_rate"] = exchange_rate
        if not match["fits_budget"] and best is not None:
            # Over-budget only: data-backed gap-closers, zero new API calls.
            resp["suggestions"] = generate_savings_suggestions(
                flights, hotels, best["flight"], best["hotel"],
                best.get("over_by", 0), nights)
        try:
            # Insight must never break the response: omit on any failure.
            resp["insight"] = generate_trip_insight(
                best, match["remaining_budget"], req.budget,
                itinerary, match["fits_budget"])
        except Exception as e:
            log.warning(f"insight generation failed (omitted): {e}")
        return resp
    except ValueError as e:
        # Unresolvable city: client's problem, raised before any SerpApi call
        # (no quota burned). Must stay 4xx, never 502.
        msg = str(e)
        if msg.startswith("unresolvable "):
            bad = msg.split(": ", 1)[1] if ": " in msg else "that city"
            return JSONResponse(status_code=400, content={
                "error": f"Couldn't find an airport for '{bad}' — "
                         f"try the 3-letter airport code instead (e.g. DEL, LHR, JFK)"})
        log.exception("plan failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})


@app.post("/api/assistant")
def api_assistant(req: AssistantReq):
    """Answer a bounded itinerary question using only the current plan data."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or api_key == "your_groq_key_here":
        return JSONResponse(status_code=503, content={
            "error": "Groq is not configured yet. Add GROQ_API_KEY to your .env file and restart the server."
        })
    try:
        from groq import Groq

        client = Groq(api_key=api_key)
        configured_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
        unavailable_models = {
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
        }
        model = "openai/gpt-oss-20b" if configured_model in unavailable_models else configured_model
        context = {
            "destination": req.destination,
            "dates": req.dates,
            "weather": req.weather or {},
            "itinerary": req.itinerary,
        }
        completion = client.chat.completions.create(
            model=model,
            temperature=0.2,
            max_tokens=500,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Trip Cost Compass's practical travel assistant. "
                        "Answer only using the supplied trip context. Treat the "
                        "weather object as important planning data: use its current "
                        "condition, temperature, rain/precipitation, wind, and humidity "
                        "when suggesting outdoor versus indoor activities, timing, or "
                        "packing. Clearly say that current weather is not a forecast "
                        "when relevant. Do not invent prices, opening hours, bookings, "
                        "or safety claims. If the context is insufficient, say so. "
                        "Keep the answer under 120 words and use short bullets when useful."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Trip context:\n{context}\n\nUser request: {req.request}",
                },
            ],
        )
        answer = (completion.choices[0].message.content or "").strip()
        if not answer:
            raise RuntimeError("Groq returned an empty response")
        return {"answer": answer, "model": model}
    except ImportError:
        return JSONResponse(status_code=503, content={
            "error": "Groq support is not installed. Run pip install -r requirements.txt and restart the server."
        })
    except Exception as e:
        log.exception("Groq assistant failed")
        return JSONResponse(status_code=502, content={
            "error": "The travel assistant is temporarily unavailable. Check your Groq key and try again."
        })
    except Exception as e:
        log.exception("plan failed")
        return JSONResponse(status_code=502, content={"error": _friendly_error(e)})


@app.get("/api/health")
def health():
    return {"ok": True}


# Serve built React frontend (committed dist/ — judges need Python only, no Node).
# Falls back to legacy /frontend if dist doesn't exist yet (zero-downtime cutover).
_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend-react" / "dist"
_FRONTEND_LEGACY = Path(__file__).resolve().parent.parent / "frontend"
_FRONTEND = _FRONTEND_DIST if _FRONTEND_DIST.exists() else _FRONTEND_LEGACY
if _FRONTEND.exists():
    app.mount("/", StaticFiles(directory=str(_FRONTEND), html=True), name="frontend")
