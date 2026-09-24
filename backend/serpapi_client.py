"""Thin wrapper around the SerpApi Python client.

One function per engine. Each returns the RAW dict from SerpApi.
Parsing lives in parsers below so test_serpapi.py can print raw shapes
before we lock parsing logic in.

Docs:
- Flights: engine=google_flights
- Hotels:  engine=google_hotels
- Places:  engine=google_maps (type=search)
- Weather: engine=google (weather answer box)        [optional, degrades to None]
- Events:  engine=google_events                     [optional, degrades to []]
- FX rate: engine=google_finance (currency pair)    [optional, degrades to None]
"""
import json
import logging
import os
import re
import time
from datetime import date as _date

from dotenv import load_dotenv

load_dotenv()
from serpapi import GoogleSearch  # noqa: E402

try:
    from backend import cache  # type: ignore  (run as uvicorn backend.main:app)
except ImportError:
    import cache  # type: ignore  (run as uvicorn main:app from backend/)

log = logging.getLogger("trip-compass")
logging.basicConfig(level=logging.INFO)

# Cache TTLs (seconds) per data type. Places/flights/hotels/events are stable
# enough for the 24h default; weather and exchange rates are "current" data
# and would look stale after a day, so they get shorter windows.
TTL_WEATHER = 6 * 3600       # 6h — current conditions, not a forecast
TTL_EXCHANGE_RATE = 12 * 3600  # 12h — fine for same-day trip planning

# Negative-cache for the OPTIONAL engines (weather/events/exchange): a live
# error (e.g. "Unsupported google_events engine", quota, bad params) is
# remembered per-params for a while so repeat plan requests skip the doomed
# call instead of re-spending quota every time. Core engines are untouched —
# they surface errors loudly. Success clears the entry.
_OPTIONAL_FAIL_UNTIL: dict[str, float] = {}
_OPTIONAL_BACKOFF_SECONDS = 6 * 3600


def _opt_key(cache_name: str, params: dict) -> str:
    return f"{cache_name}:{json.dumps(params, sort_keys=True, default=str)}"


def _opt_in_backoff(cache_name: str, params: dict) -> bool:
    until = _OPTIONAL_FAIL_UNTIL.get(_opt_key(cache_name, params))
    return until is not None and time.time() < until


def _opt_mark_failed(cache_name: str, params: dict) -> None:
    _OPTIONAL_FAIL_UNTIL[_opt_key(cache_name, params)] = time.time() + _OPTIONAL_BACKOFF_SECONDS


def _opt_mark_ok(cache_name: str, params: dict) -> None:
    _OPTIONAL_FAIL_UNTIL.pop(_opt_key(cache_name, params), None)


def _api_key() -> str:
    key = os.getenv("SERPAPI_API_KEY", "")
    if not key or key == "your_key_here":
        raise ValueError("SERPAPI_API_KEY is missing. Copy .env.example to .env and add your key.")
    return key


def _search(params: dict, cache_name: str, skip_cache: bool = False,
            ttl_seconds: int | None = None) -> dict:
    if not skip_cache:
        cached = cache.get(cache_name, params, ttl_seconds=ttl_seconds)
        if cached is not None:
            log.info(f"[cache HIT] {cache_name} params={params}")
            out = dict(cached)
            out["_from_cache"] = True
            return out
    else:
        log.info(f"[force live] {cache_name} params={params}")
    log.info(f"[live API] {cache_name} params={params}")
    try:
        results = GoogleSearch({**params, "api_key": _api_key()}).get_dict()
    except Exception as e:
        log.error(f"SerpApi {cache_name} failed: {type(e).__name__}: {e}")
        raise
    if "error" in results:
        # SerpApi returns {"error": "..."} for bad key / quota / bad params
        log.error(f"SerpApi {cache_name} error: {results['error']}")
        raise RuntimeError(results["error"])
    cache.set(cache_name, params, results)
    results["_from_cache"] = False
    return results


# ---------------- raw fetchers ----------------

# Offline airport lookup (airportsdata package: 7,884 IATA airports, no network).
# Replaces the old hand-written CITY_TO_AIRPORT dict, which couldn't cover
# every city (e.g. typing "Goa" resolved to GOA/Genoa, Italy instead of GOI).
#
# Overrides below exist for exactly two reasons, nothing else:
#  1. Multi-airport cities where the dataset has several matches and no
#     traffic ranking to pick from — each maps to the well-known main gateway.
#  2. "goa": the dataset lists Goa's airport under city "Dabolim", so neither
#     exact nor substring search can ever find it — this alias is the only
#     way "Goa" resolves to GOI.
AIRPORT_OVERRIDES = {
    "london": "LHR",    # 8 airports (LGW, STN, LTN, LCY…); Heathrow is the main gateway
    "new york": "JFK",  # 5 entries incl. seaplane base/stewart; JFK is the main gateway
    "paris": "CDG",     # ORY/LBG also match; CDG is the main gateway
    "tokyo": "NRT",     # long-haul international gateway (HND is the closer domestic hub)
    "moscow": "SVO",    # main international gateway
    "goa": "GOI",       # dataset city is "Dabolim" — unfindable without this alias
}

import airportsdata  # offline IATA dataset (see requirements.txt)

import difflib  # stdlib: typo-tolerant close-match, no new dependency

_AIRPORTS = airportsdata.load("IATA")  # {code: {city, name, country, ...}}, loaded once

_BY_CITY: dict[str, list[str]] = {}
for _code, _entry in _AIRPORTS.items():
    _BY_CITY.setdefault((_entry.get("city") or "").casefold(), []).append(_code)

_CITY_NAMES = sorted(_BY_CITY)  # fuzzy pool for typo tolerance below


def _prefer_main(codes: list[str]) -> str:
    """Deterministic pick among several airports: prefer one with
    'International' in its name (usually the main gateway), else lowest code."""
    intl = [c for c in codes
            if "international" in (_AIRPORTS[c].get("name") or "").casefold()]
    return sorted(intl or codes)[0]


def resolve_city_to_airport(input_str: str) -> str | None:
    """    Resolve a city name or IATA code to a 3-letter airport code, offline.

    Order: (a) valid IATA code passes through; (b) small override dict
    (multi-airport mains + the Goa alias); (c) exact city match;
    (d) substring fallback over city, then airport name (catches "Delhi" in
    "New Delhi", "Bengaluru" in "Bengaluru International Airport");
    (e) typo tolerance: closest city name at difflib ratio >= 0.8
    (catches "lucnknow" -> Lucknow/LKO, "Mumbay" -> Mumbai/BOM).
    Returns None when nothing matches — callers must 400, never pass
    unresolved input to the flights API. Pure function (dataset is
    module-level, no I/O per call).
    """
    if not input_str or not input_str.strip():
        return None
    v = input_str.strip()
    q = v.casefold()
    if len(v) == 3 and v.isupper() and v in _AIRPORTS:
        return v  # explicit code form always wins, e.g. GOA means Genoa
    if q in AIRPORT_OVERRIDES:
        code = AIRPORT_OVERRIDES[q]
        return code if code in _AIRPORTS else None
    if len(v) == 3 and v.upper() in _AIRPORTS:
        return v.upper()  # already a valid code, e.g. DEL, LHR
    exact = [c for c in _BY_CITY.get(q, []) if c in _AIRPORTS]
    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        return _prefer_main(exact)
    city_hits = [c for c, e in _AIRPORTS.items()
                 if q in (e.get("city") or "").casefold()]
    if city_hits:
        return _prefer_main(city_hits)
    name_hits = [c for c, e in _AIRPORTS.items()
                 if q in (e.get("name") or "").casefold()]
    if name_hits:
        return _prefer_main(name_hits)
    # (e) Typo tolerance, last resort: closest city name at difflib >= 0.8.
    # Gated on length >= 4 so short/garbage input still returns None — and
    # callers still 400 before any SerpApi call, so no quota is burned.
    if len(q) >= 4:
        close = difflib.get_close_matches(q, _CITY_NAMES, n=1, cutoff=0.8)
        if close:
            codes = [c for c in _BY_CITY.get(close[0], []) if c in _AIRPORTS]
            if len(codes) == 1:
                return codes[0]
            if len(codes) > 1:
                return _prefer_main(codes)
    return None


def fetch_flights_raw(origin: str, destination: str, departure_date: str,
                       return_date: str | None = None, travelers: int = 1,
                       force_refresh: bool = False) -> dict:
    dep = resolve_city_to_airport(origin)
    arr = resolve_city_to_airport(destination)
    # Fail BEFORE any SerpApi call: garbage input must never burn quota.
    if dep is None:
        raise ValueError(f"unresolvable origin: {origin.strip()}")
    if arr is None:
        raise ValueError(f"unresolvable destination: {destination.strip()}")
    params = {
        "engine": "google_flights",
        "departure_id": dep,
        "arrival_id": arr,
        "outbound_date": departure_date,
        "currency": "INR",
        "hl": "en",
    }
    if return_date:
        params["return_date"] = return_date
    # SerpApi expects adults_cabin? keep minimal; travelers handled in parsing/total
    return _search(params, "flights", skip_cache=force_refresh)


def fetch_hotels_raw(destination: str, check_in: str, check_out: str,
                      travelers: int = 1, force_refresh: bool = False) -> dict:
    params = {
        "engine": "google_hotels",
        "q": destination,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": travelers,
        "currency": "INR",
        "hl": "en",
    }
    return _search(params, "hotels", skip_cache=force_refresh)


def fetch_places_raw(location: str, category: str, force_refresh: bool = False) -> dict:
    """category: 'attractions' or 'restaurants'.

    Separate calls per category are required: a query for "attractions near X"
    returns ~100% Tourist attraction/Fortress/Park types and zero restaurants,
    and vice versa (verified against cached local_results). One broad query
    cannot supply both sides of the itinerary, so /api/plan spends 2 searches
    here by design.
    """
    query = f"{category} near {location}" if category not in location.lower() else location
    params = {
        "engine": "google_maps",
        "q": query,
        "type": "search",
        "hl": "en",
    }
    return _search(params, f"places_{category}", skip_cache=force_refresh)


# ---------------- parsers (defensive: SerpApi fields vary) ----------------

def _to_inr_number(value) -> int | None:
    """Extract integer rupees from '$1,200', '₹45,000', 45000, etc."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).replace("₹", "").replace("$", "").replace(",", "").strip()
    digits = "".join(ch for ch in s if ch.isdigit())
    return int(digits) if digits else None


def parse_flights(raw: dict, travelers: int = 1) -> list[dict]:
    """Return [{airline, price, duration, stops, ...}]. Handles 2 shapes:
    - best_flights / other_flights (lists of {flights:[...], price, total_duration})
    - flights_results (older shape)
    """
    out: list[dict] = []
    groups = []
    if isinstance(raw.get("best_flights"), list):
        groups += raw["best_flights"]
    if isinstance(raw.get("other_flights"), list):
        groups += raw["other_flights"]
    if not groups and isinstance(raw.get("flights_results"), list):
        groups = raw["flights_results"]

    for g in groups[:15]:
        try:
            legs = g.get("flights") or []
            first = legs[0] if legs else g
            airline = (
                first.get("airline")
                or g.get("airline")
                or ", ".join(l.get("airline", "") for l in legs if l.get("airline"))
                or "Unknown airline"
            )
            price = _to_inr_number(g.get("price") or g.get("total_price") or first.get("price"))
            if price is None:
                continue  # skip entries without a usable price
            duration = g.get("total_duration") or first.get("duration") or "—"
            if isinstance(duration, (int, float)):
                duration = f"{int(duration // 60)}h {int(duration % 60)}m"
            stops = g.get("layovers") or first.get("layovers")
            if isinstance(stops, list):
                n_stops = len(stops)
            elif isinstance(stops, int):
                n_stops = stops
            else:
                n_stops = len(legs) - 1 if len(legs) > 1 else 0
            out.append({
                "airline": str(airline),
                "price": price * max(1, travelers),
                "price_per_person": price,
                "duration": str(duration),
                "stops": n_stops,
                "departure": first.get("departure_airport", {}) if isinstance(first.get("departure_airport"), dict) else {},
                "arrival": first.get("arrival_airport", {}) if isinstance(first.get("arrival_airport"), dict) else {},
            })
        except Exception as e:
            log.warning(f"skip malformed flight entry: {e}")
            continue
    return sorted(out, key=lambda f: f["price"])


def _to_lat_lng(item: dict) -> tuple[float | None, float | None]:
    """Extract (lat, lng) from SerpApi gps_coordinates. Returns (None, None) if absent."""
    try:
        gps = item.get("gps_coordinates") or {}
        lat = gps.get("latitude")
        lng = gps.get("longitude")
        if lat is None or lng is None:
            return None, None
        return float(lat), float(lng)
    except (ValueError, TypeError):
        return None, None


def parse_hotels(raw: dict, num_nights: int) -> list[dict]:
    """Return [{name, rating, price_per_night, total_price, lat, lng, ...}]."""
    props = raw.get("properties") or raw.get("hotels_results") or []
    out: list[dict] = []
    for h in props[:15]:
        try:
            name = h.get("name") or "Unnamed hotel"
            rating = h.get("overall_rating") or h.get("rating") or h.get("stars")
            try:
                rating = float(str(rating).split()[0]) if rating else None
            except ValueError:
                rating = None
            # rate_per_night shape: {"lowest": "₹4,500"}  OR  price:"$120"
            nightly_raw = None
            rpn = h.get("rate_per_night") or {}
            if isinstance(rpn, dict):
                nightly_raw = rpn.get("lowest") or rpn.get("extracted_lowest")
            nightly_raw = nightly_raw or h.get("price") or h.get("extracted_price")
            # total_rate shape: {"lowest": "₹9,000"}
            total_raw = None
            tr = h.get("total_rate") or {}
            if isinstance(tr, dict):
                total_raw = tr.get("lowest") or tr.get("extracted_lowest")
            nightly = _to_inr_number(nightly_raw)
            total = _to_inr_number(total_raw)
            if nightly is None and total is not None and num_nights > 0:
                nightly = round(total / num_nights)
            if total is None and nightly is not None:
                total = nightly * num_nights
            if nightly is None:
                continue
            lat, lng = _to_lat_lng(h)
            out.append({
                "name": str(name),
                "rating": rating,
                "price_per_night": nightly,
                "total_price": total,
                "amenities": (h.get("amenities") or [])[:6],
                "lat": lat,
                "lng": lng,
            })
        except Exception as e:
            log.warning(f"skip malformed hotel entry: {e}")
            continue
    return sorted(out, key=lambda h: h["total_price"])


def parse_places(raw: dict, category: str) -> list[dict]:
    """Return [{name, rating, category, address, lat, lng}]."""
    results = raw.get("local_results") or raw.get("place_results") or []
    out: list[dict] = []
    for p in results[:20]:
        try:
            name = p.get("title") or p.get("name")
            if not name:
                continue
            rating = p.get("rating")
            try:
                rating = float(rating) if rating else None
            except ValueError:
                rating = None
            lat, lng = _to_lat_lng(p)
            out.append({
                "name": str(name),
                "rating": rating,
                "category": category,
                "address": p.get("address") or p.get("description") or "",
                "lat": lat,
                "lng": lng,
            })
        except Exception as e:
            log.warning(f"skip malformed place entry: {e}")
            continue
    return out


# ============ OPTIONAL FEATURES (each degrades to None/[] on any failure) ============

# ---------------- 1. weather snapshot (CURRENT conditions, not a forecast) ----------------

def parse_weather(raw: dict) -> dict | None:
    """Parse the google engine's weather answer box.

    Verified shape (SerpApi docs, https://serpapi.com/direct-answer-box-api):
      answer_box = {type: "weather_result", temperature: "31", unit: "Celsius",
                    weather: "Partly cloudy", humidity: "74%", wind: "...",
                    location: "Goa", date: "Thursday 2:00 PM", thumbnail/icon: ...}
    Returns only fields actually present, or None when there's no usable box.
    """
    box = raw.get("answer_box")
    if not isinstance(box, dict):
        return None
    # Only the current-conditions box. Other answer_box types (e.g.
    # "weather_year_round" averages) are not current conditions — omit.
    if box.get("type") not in (None, "weather_result"):
        return None
    temperature = box.get("temperature")
    condition = box.get("weather") or box.get("condition")
    if temperature is None and condition is None:
        return None
    out: dict = {}
    if temperature is not None:
        out["temperature"] = str(temperature)
    if box.get("unit"):
        out["unit"] = str(box["unit"])
    if condition:
        out["condition"] = str(condition)
    if box.get("humidity"):
        out["humidity"] = str(box["humidity"])
    if box.get("wind"):
        out["wind"] = str(box["wind"])
    if box.get("precipitation"):
        out["precipitation"] = str(box["precipitation"])
    if box.get("location"):
        out["location"] = str(box["location"])
    if box.get("date"):
        out["observed"] = str(box["date"])
    if box.get("thumbnail") or box.get("icon"):
        out["icon"] = str(box.get("thumbnail") or box.get("icon"))
    return out


def fetch_weather_snapshot(destination: str, force_refresh: bool = False) -> dict | None:
    """Current conditions via the general google engine's weather answer box.

    IMPORTANT: this is what Google shows as *right now* — NOT a forecast for
    the user's travel dates (which may be weeks/months out). The UI must
    label it as such. Returns None on ANY failure (bad key, quota, no box,
    parse miss) — callers omit the section, never crash.
    """
    dest = (destination or "").strip()
    if not dest:
        return None
    params = {"engine": "google", "q": f"weather in {dest}", "hl": "en", "gl": "in"}
    if _opt_in_backoff("weather", params):
        log.info(f"[backoff] weather for {dest!r} — recent failure, skipping live call")
        return None
    try:
        raw = _search(params, "weather", skip_cache=force_refresh,
                      ttl_seconds=TTL_WEATHER)
        _opt_mark_ok("weather", params)
        snapshot = parse_weather(raw)
        if snapshot is None:
            log.info(f"weather: no weather answer box for {dest!r} (omitted)")
        return snapshot
    except Exception as e:
        _opt_mark_failed("weather", params)
        log.warning(f"weather snapshot failed (omitted): {type(e).__name__}: {e}")
        return None


# ---------------- 2. local events (google_events) ----------------

_MONTH_ABBRS = ("jan", "feb", "mar", "apr", "may", "jun",
                "jul", "aug", "sep", "oct", "nov", "dec")
# "Oct 12" / "Nov 8" (month-day, the docs' start_date format)
_MD_RE = re.compile(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b",
                    re.IGNORECASE)
# "03 Jan" (day-month, seen inside `when` strings like "Sat, 03 Jan, 21:00")
_DM_RE = re.compile(r"\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\b",
                    re.IGNORECASE)


def _parse_month_day(text) -> tuple[int, int] | None:
    """Extract (month, day) from a Google Events date string, else None.

    Google's start_date has NO year ("Oct 12"), so matching is done on
    month/day against the trip's month/day window — documented approximation,
    never invented data.
    """
    if not text:
        return None
    s = str(text)
    m = _MD_RE.search(s)
    if m:
        return _MONTH_ABBRS.index(m.group(1)[:3].lower()) + 1, int(m.group(2))
    m = _DM_RE.search(s)
    if m:
        return _MONTH_ABBRS.index(m.group(2)[:3].lower()) + 1, int(m.group(1))
    return None


def _in_trip_window(md: tuple[int, int], start_iso: str, end_iso: str) -> bool:
    """True when the event's (month, day) falls inside the trip's date range."""
    try:
        s = _date.fromisoformat(start_iso)
        e = _date.fromisoformat(end_iso)
    except (ValueError, TypeError):
        return False
    ev = (md[0], md[1])
    lo = (s.month, s.day)
    hi = (e.month, e.day)
    return lo <= ev <= hi


def fetch_events_raw(destination: str, start_date: str, end_date: str,
                     force_refresh: bool = False) -> dict:
    """Fetch raw google_events results for a destination.

    Engine params verified against SerpApi's Google Events docs
    (https://serpapi.com/google-events-api): `q` is the only required param;
    there is NO arbitrary date-range filter — only `htichips` preset chips
    (today/week/month/next_month), which cannot express a trip window like
    2026-10-10..2026-10-13. So start/end dates are intentionally NOT sent
    (they'd be dead weight in the request) and are applied client-side in
    parse_events() instead. Consequently the cache key is destination-only —
    dates are omitted from cache params per the rule "keyed by destination
    (+ dates only if the engine supports date params)". Same destination on
    different trips shares one cached fetch; re-filtering is free.

    Raises on API failure (callers wrap in try/except and degrade to []).
    """
    dest = (destination or "").strip()
    if not dest:
        raise ValueError("destination required for events")
    # SerpApi's own guidance: location inside the query gets better geo-
    # relevance than a bare city name ("Events in Austin" pattern).
    params = {"engine": "google_events", "q": f"events in {dest}", "hl": "en", "gl": "in"}
    if _opt_in_backoff("events", params):
        # Repeat of a recent failure (e.g. engine unsupported on this plan):
        # skip the live call entirely — zero quota — and let the endpoint
        # degrade to [] exactly as it does on the original failure.
        raise RuntimeError("events in failure backoff — skipping live call")
    try:
        raw = _search(params, "events", skip_cache=force_refresh)
    except Exception:
        _opt_mark_failed("events", params)
        raise
    _opt_mark_ok("events", params)
    return raw


def parse_events(raw: dict, start_date: str | None = None,
                 end_date: str | None = None, cap: int = 8) -> list[dict]:
    """Parse google_events results -> [{title, date, venue, description, link}].

    Verified shape (SerpApi docs): events_results = [{title,
      date: {start_date: "Oct 12", when: "Sat, Oct 12, 18:00"},
      address: [...], link, description, venue: {name, rating, ...}}].

    When start_date/end_date are given, ONLY events whose listed date falls
    inside that window are kept; events with no parseable date are dropped
    (can't confirm relevance — never show possibly-wrong-dated events).
    Capped at `cap` (default 8) to keep the plan response lean.
    """
    results = raw.get("events_results")
    if not isinstance(results, list):
        return []
    filter_by_date = bool(start_date and end_date)
    out: list[dict] = []
    for ev in results:
        if len(out) >= cap:
            break
        if not isinstance(ev, dict):
            continue
        try:
            title = ev.get("title")
            if not title:
                continue
            date_info = ev.get("date") if isinstance(ev.get("date"), dict) else {}
            md = _parse_month_day(date_info.get("start_date")) \
                or _parse_month_day(date_info.get("when"))
            if filter_by_date:
                if md is None or not _in_trip_window(md, start_date, end_date):
                    continue
            venue = (ev.get("venue") or {}).get("name") if isinstance(ev.get("venue"), dict) else None
            if not venue:
                addr = ev.get("address")
                venue = ", ".join(a for a in addr if a) if isinstance(addr, list) else (addr or "")
            desc = str(ev.get("description") or "").strip()
            if len(desc) > 200:
                desc = desc[:199].rstrip() + "…"
            link = ev.get("link") or ""
            when = date_info.get("when") or date_info.get("start_date") or ""
            out.append({
                "title": str(title),
                "date": str(when),
                "venue": str(venue or ""),
                "description": desc,
                "link": str(link),
            })
        except Exception as e:
            log.warning(f"skip malformed event entry: {e}")
            continue
    return out


# ---------------- 3. currency context (google_finance) ----------------

# airportsdata `country` is ISO 3166-1 alpha-2. Map only countries we can
# name a currency for with confidence; unknown country => feature omitted
# (no guessing, no fabricated rates).
COUNTRY_CURRENCY = {
    "IN": "INR", "GB": "GBP", "US": "USD", "AE": "AED", "TH": "THB",
    "SG": "SGD", "MY": "MYR", "ID": "IDR", "VN": "VND", "JP": "JPY",
    "AU": "AUD", "CA": "CAD", "CH": "CHF", "CN": "CNY", "HK": "HKD",
    "FR": "EUR", "DE": "EUR", "IT": "EUR", "ES": "EUR", "NL": "EUR",
    "PT": "EUR", "GR": "EUR", "IE": "EUR", "BE": "EUR", "AT": "EUR",
    "FI": "EUR", "LU": "EUR", "SK": "EUR", "SI": "EUR", "HR": "EUR",
    "CY": "EUR", "MT": "EUR", "TR": "TRY", "EG": "EGP", "LK": "LKR",
    "NP": "NPR", "BD": "BDT", "PK": "PKR", "ZA": "ZAR", "NZ": "NZD",
    "KR": "KRW", "RU": "RUB", "MX": "MXN", "BR": "BRL", "SA": "SAR",
    "QA": "QAR", "OM": "OMR", "KW": "KWD", "BH": "BHD", "JO": "JOD",
    "MA": "MAD", "KE": "KES", "TZ": "TZS", "UA": "UAH", "PL": "PLN",
    "CZ": "CZK", "DK": "DKK", "SE": "SEK", "NO": "NOK", "IS": "ISK",
    "PH": "PHP", "KH": "KHR", "MM": "MMK", "MN": "MNT", "IL": "ILS",
    "AR": "ARS", "CL": "CLP", "CO": "COP", "PE": "PEN", "GE": "GEL",
    "AM": "AMD", "AZ": "AZN", "RS": "RSD", "BG": "BGN", "RO": "RON",
    "HU": "HUF", "NG": "NGN", "GH": "GHS", "ET": "ETB", "DZ": "DZD",
    "TN": "TND", "UY": "UYU", "PY": "PYG", "BO": "BOB",
}


def country_for_city(city: str) -> str | None:
    """ISO alpha-2 country of the airport that resolves for `city`, else None.

    Reuses resolve_city_to_airport + the already-loaded airportsdata entries
    (offline, zero API cost). Pure lookup — no new dataset.
    """
    code = resolve_city_to_airport(city or "")
    if not code:
        return None
    entry = _AIRPORTS.get(code) or {}
    country = str(entry.get("country") or "").strip().upper()
    return country or None


def parse_exchange_rate(raw: dict) -> float | None:
    """Extract the pair's rate (units of TO per 1 FROM) from a google_finance
    response. Verified against SerpApi's Google Finance docs: `summary.
    extracted_price` + `summary.currency` carry the headline quote; for
    currency pairs Google's page (and thus SerpApi) mirrors that structure.
    Falls back to the last `graph` point (Google's own rate history for the
    pair) when summary is absent. None when nothing usable — never guess.
    """
    summary = raw.get("summary")
    if isinstance(summary, dict):
        for key in ("extracted_price", "price"):
            try:
                val = summary.get(key)
                if isinstance(val, str):
                    # "INR94.56" / "94.56" -> 94.56
                    m = re.search(r"\d+(?:\.\d+)?", val.replace(",", ""))
                    val = float(m.group()) if m else None
                elif val is not None:
                    val = float(val)
                if val is not None and val > 0:
                    return val
            except (TypeError, ValueError):
                continue
    graph = raw.get("graph")
    if isinstance(graph, list) and graph:
        try:
            last = graph[-1]
            val = float(last.get("price")) if isinstance(last, dict) else float(last)
            if val > 0:
                return val
        except (TypeError, ValueError, KeyError):
            pass
    return None


def fetch_exchange_rate(from_currency: str, to_currency: str,
                        force_refresh: bool = False) -> dict | None:
    """google_finance currency-pair rate: q='{FROM}-{TO}' (hyphen pair syntax
    per SerpApi/Google Finance docs — "USD-INR", not "USD/INR"). Rate =
    units of TO per 1 FROM. Returns {rate, from_currency, to_currency} or
    None on ANY failure — callers omit the field entirely.
    """
    fr = (from_currency or "").strip().upper()
    to = (to_currency or "").strip().upper()
    if not fr or not to or fr == to:
        return None
    params = {"engine": "google_finance", "q": f"{fr}-{to}", "hl": "en"}
    if _opt_in_backoff("exchange_rate", params):
        log.info(f"[backoff] exchange rate {fr}-{to} — recent failure, skipping live call")
        return None
    try:
        raw = _search(params, "exchange_rate", skip_cache=force_refresh,
                      ttl_seconds=TTL_EXCHANGE_RATE)
        _opt_mark_ok("exchange_rate", params)
        rate = parse_exchange_rate(raw)
        if rate is None:
            log.info(f"exchange rate: no rate in response for {fr}-{to} (omitted)")
            return None
        return {"rate": rate, "from_currency": fr, "to_currency": to}
    except Exception as e:
        _opt_mark_failed("exchange_rate", params)
        log.warning(f"exchange rate failed (omitted): {type(e).__name__}: {e}")
        return None
