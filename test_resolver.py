"""Offline unit tests for resolve_city_to_airport() — zero API calls, zero quota.

Run from project root:  python test_resolver.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from serpapi_client import resolve_city_to_airport

CASES = [
    # (input, expected, why)
    ("DEL", "DEL", "valid code passes through"),
    ("LHR", "LHR", "valid code passes through"),
    ("del", "DEL", "lowercase code still passes through"),
    ("Bengaluru", "BLR", "dataset city is 'Bangalore' — matched via airport name"),
    ("Mumbai", "BOM", "exact single-airport city"),
    ("Jaipur", "JAI", "exact single-airport city (was never in old hardcoded list)"),
    ("Delhi", "DEL", "dataset city is 'New Delhi' — substring fallback"),
    ("London", "LHR", "multi-airport override"),
    ("New York", "JFK", "multi-airport override"),
    ("Paris", "CDG", "multi-airport override"),
    ("Goa", "GOI", "the Genoa bug: must be GOI, never GOA"),
    ("GOA", "GOA", "explicit uppercase code form always wins (Genoa)"),
    ("Xyzabc123", None, "unresolvable returns None"),
    ("qqq", None, "short garbage returns None (fuzzy gated on len>=4)"),
    ("lucnknow", "LKO", "typo tolerance: transposed letters -> Lucknow"),
    ("Mumbay", "BOM", "typo tolerance: one-letter-off -> Mumbai"),
    ("Jaipor", "JAI", "typo tolerance: one-letter-off -> Jaipur"),
    ("New Delih", "DEL", "typo tolerance: multi-word city typo -> Delhi"),
    ("", None, "empty returns None"),
    ("   ", None, "blank returns None"),
]

failures = 0
for given, expected, why in CASES:
    got = resolve_city_to_airport(given)
    ok = got == expected
    failures += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {given!r:14} -> {got!r:8} (expected {expected!r})  [{why}]")

print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
sys.exit(1 if failures else 0)
