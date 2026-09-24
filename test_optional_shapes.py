"""Zero-quota shape probe for the three optional engines (weather / events / FX).

Everything here hits backend/.cache first, so re-runs are free:
- weather Goa + FX INR-GBP: served from cache (fetched live once each).
- events Goa: engine rejected as unsupported on this plan -> shows the
  graceful-degradation path ([]), and reports the real error string.

If the SerpApi key/plan later supports google_events, delete
backend/.cache/events_*.json (or call with force_refresh) to take one live
look at the true `events_results` shape before trusting parse_events().

Usage (from project root):
    venv\\Scripts\\python.exe test_optional_shapes.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from backend.serpapi_client import _search  # same params the app uses


def peek(title, cache_name, params):
    print(f"\n===== {title} =====")
    try:
        raw = _search(dict(params), cache_name)
    except Exception as e:
        print(f"(fetch raised — endpoint degrades) {type(e).__name__}: {e}")
        return
    print("from_cache:", raw.get("_from_cache"))
    keys = sorted(k for k in raw.keys() if not k.startswith("_"))
    print("top-level keys:", keys)
    for sub in ("answer_box", "events_results", "summary"):
        if sub in raw:
            val = raw[sub]
            n = len(val) if isinstance(val, list) else 1
            print(f"--- {sub} ({n}) ---")
            print(json.dumps(val if isinstance(val, dict) else val[:2],
                             indent=1, default=str)[:2500])


if __name__ == "__main__":
    peek("WEATHER Goa", "weather",
         {"engine": "google", "q": "weather in Goa", "hl": "en", "gl": "in"})
    peek("FX INR-GBP", "exchange_rate",
         {"engine": "google_finance", "q": "INR-GBP", "hl": "en"})
    peek("EVENTS Goa", "events",
         {"engine": "google_events", "q": "events in Goa",
          "hl": "en", "gl": "in"})
    print("\nDone. Repeat runs cost zero quota (file cache).")
