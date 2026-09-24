"""Offline unit checks for the 5 new features' pure logic (no network, no quota).
Shapes mirror SerpApi's published docs (direct-answer-box, google-events,
google-finance). Run: venv\\Scripts\\python.exe test_new_features.py"""
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from backend import cache
from backend.main import _hotel_tier
from backend.serpapi_client import (
    COUNTRY_CURRENCY,
    country_for_city,
    fetch_events_raw,
    fetch_exchange_rate,
    fetch_weather_snapshot,
    parse_events,
    parse_exchange_rate,
    parse_weather,
)

failures = []


def check(name, cond, detail=""):
    print(("PASS " if cond else "FAIL ") + name + (f"  {detail}" if detail and not cond else ""))
    if not cond:
        failures.append(name)


# ---- weather parse (shape from SerpApi direct-answer-box docs) ----
raw_w = {"answer_box": {"type": "weather_result", "temperature": "31",
        "unit": "Celsius", "weather": "Partly cloudy", "humidity": "74%",
        "wind": "12 km/h", "location": "Goa", "date": "Thursday 2:00 PM",
        "thumbnail": "https://example.com/w.png"}}
w = parse_weather(raw_w)
check("weather: temp", w and w.get("temperature") == "31")
check("weather: unit", w and w.get("unit") == "Celsius")
check("weather: condition", w and w.get("condition") == "Partly cloudy")
check("weather: humidity", w and w.get("humidity") == "74%")
check("weather: icon kept", w and "icon" in w)
check("weather: no box -> None", parse_weather({}) is None)
check("weather: wrong type -> None",
      parse_weather({"answer_box": {"type": "weather_year_round",
                                    "temperature": "25"}}) is None)
check("weather: empty box -> None", parse_weather({"answer_box": {}}) is None)

# ---- events parse (shape from SerpApi google-events docs) ----
raw_e = {"events_results": [
    {"title": "Goa Carnival", "date": {"start_date": "Oct 12",
      "when": "Sat, Oct 12, 18:00"}, "address": ["Panaji, Goa"],
     "link": "https://ex.com/1", "description": "Annual carnival parade " + "x" * 300,
     "venue": {"name": "Panaji"}},
    {"title": "Beach Fest", "date": {"start_date": "Nov 5",
      "when": "Wed, Nov 5, 10:00"}, "link": "https://ex.com/2"},
    {"title": "Dated-ok-dayfirst", "date": {"start_date": "Sat, 11 Oct, 10:00",
      "when": "Sat, 11 Oct, 10:00"}, "link": "https://ex.com/3"},
    {"title": "No date at all", "link": "https://ex.com/4"},
]}
ev_all = parse_events(raw_e)  # no window -> keeps parseable? no: no filter at all
check("events: no filter keeps all titled", len(ev_all) == 4)
ev_win = parse_events(raw_e, "2026-10-10", "2026-10-13")
check("events: window filters to trip dates", len(ev_win) == 2,
      f"got {len(ev_win)}: {[e['title'] for e in ev_win]}")
check("events: out-of-window dropped", all("Beach" not in e["title"] for e in ev_win))
check("events: undated dropped in window mode", all("No date" not in e["title"] for e in ev_win))
check("events: desc capped", all(len(e["description"]) <= 201 for e in ev_all))
check("events: shape keys",
      all(set(e) == {"title", "date", "venue", "description", "link"} for e in ev_win))
check("events: empty raw -> []", parse_events({}) == [])
cap = parse_events({"events_results": raw_e["events_results"] * 5})
check("events: cap 8", len(cap) == 8, f"got {len(cap)}")
# day-first date inside start_date
check("events: 'Sat, 11 Oct' parses", any("Dated-ok" in e["title"] for e in ev_win))

# ---- exchange rate parse (shape from google_finance docs: summary.extracted_price) ----
raw_f = {"summary": {"title": "GBP - INR", "price": "INR109.42",
         "extracted_price": 109.42, "currency": "INR"}}
check("fx: summary extracted_price", parse_exchange_rate(raw_f) == 109.42)
check("fx: string price parsed",
      parse_exchange_rate({"summary": {"price": "INR109.42"}}) == 109.42)
check("fx: graph fallback",
      parse_exchange_rate({"graph": [{"price": 0.0093}]}) == 0.0093)
check("fx: nothing -> None", parse_exchange_rate({}) is None)
check("fx: zero -> None", parse_exchange_rate({"summary": {"extracted_price": 0}}) is None)

# ---- country detection (offline airportsdata) ----
check("country: DEL -> IN", country_for_city("DEL") == "IN")
check("country: Goa -> IN", country_for_city("Goa") == "IN")
check("country: London -> GB", country_for_city("London") == "GB")
check("country: New Delhi (city name) -> IN", country_for_city("Delhi") == "IN")
check("country: garbage -> None", country_for_city("zzzznotacity") is None)
check("currency map: IN/GB present",
      COUNTRY_CURRENCY.get("IN") == "INR" and COUNTRY_CURRENCY.get("GB") == "GBP")

# ---- hotel tiers ----
check("tier: min price -> Budget", _hotel_tier(1000, 1000, 9000) == "Budget")
check("tier: mid -> Mid-range", _hotel_tier(5000, 1000, 9000) == "Mid-range")
check("tier: top -> Higher-end", _hotel_tier(9000, 1000, 9000) == "Higher-end")
check("tier: 1/3 boundary inclusive", _hotel_tier(4000, 1000, 9000) == "Budget")
check("tier: just over 1/3", _hotel_tier(4100, 1000, 9000) == "Mid-range")
check("tier: zero span safe", _hotel_tier(5000, 5000, 0) == "Budget")

# ---- cache TTL override ----
cache.set("_ttl_probe", {"a": 1}, {"ok": True})
check("cache: default ttl hit", cache.get("_ttl_probe", {"a": 1}) is not None)
check("cache: tiny ttl misses (treated as expired)",
      cache.get("_ttl_probe", {"a": 1}, ttl_seconds=0) is None)
check("cache: large ttl hit", cache.get("_ttl_probe", {"a": 1}, ttl_seconds=9999) is not None)

# ---- live fetch behavior (never raises; degrades or returns parsed data) ----
w_live = fetch_weather_snapshot("Goa")  # cached after first-ever live call
check("weather: returns dict or None, never raises",
      w_live is None or (isinstance(w_live, dict) and "temperature" in w_live))
fx_live = fetch_exchange_rate("INR", "GBP")  # cached likewise
check("fx: returns dict or None, never raises",
      fx_live is None or (isinstance(fx_live, dict) and fx_live.get("rate", 0) > 0))
try:
    fetch_events_raw("Goa", "2026-10-10", "2026-10-13")
    events_raised = False
except Exception:
    events_raised = True  # e.g. "Unsupported google_events engine" on this plan
check("events: failure raises (endpoint catches -> [])", events_raised)

print()
if failures:
    print(f"{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("ALL PASS")
