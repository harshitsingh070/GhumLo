"""Standalone SerpApi probe — run BEFORE trusting parsing logic.

Uses tiny live calls (3 searches total) then caches to backend/.cache/
so re-runs are free. Prints raw keys + first items so you can adapt
parsers in backend/serpapi_client.py to the real shape.

Usage (from project root):
    pip install -r requirements.txt
    copy .env.example to .env and set SERPAPI_API_KEY
    python test_serpapi.py
"""
import json
import os

from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from serpapi_client import fetch_flights_raw, fetch_hotels_raw, fetch_places_raw


def peek(title: str, data: dict, item_key: str):
    print(f"\n===== {title} =====")
    print("top-level keys:", sorted(k for k in data.keys() if not k.startswith("_")))
    print("from_cache:", data.get("_from_cache"))
    if data.get("error"):
        print("ERROR:", data["error"])
        return
    items = data.get(item_key) or []
    print(f"{item_key}: {len(items)} items")
    if items:
        print("first item keys:", sorted(items[0].keys()))
        print(json.dumps(items[0], indent=2, default=str)[:2000])


if __name__ == "__main__":
    # Small, cheap queries. Change cities/dates as needed.
    f = fetch_flights_raw("DEL", "BOM", "2026-10-10", "2026-10-13", 1)
    # Flights come as best_flights/other_flights, not one list:
    for k in ("best_flights", "other_flights"):
        if isinstance(f.get(k), list) and f[k]:
            peek("FLIGHTS", f, k)
            break
    else:
        peek("FLIGHTS", f, "best_flights")

    h = fetch_hotels_raw("Goa", "2026-10-10", "2026-10-13", 2)
    peek("HOTELS", h, "properties" if "properties" in h else "hotels_results")

    p = fetch_places_raw("Goa", "attractions")
    peek("PLACES", p, "local_results" if "local_results" in p else "place_results")

    print("\nDone. Re-run is free (file cache in backend/.cache/).")
