"""Natural-language trip parsing — heuristic first, Groq when configured.

parse_nl_trip(text) -> dict with any of:
  origin, destination, departure_date, return_date, travelers, budget,
  travel_mode, diet
Dates are ISO YYYY-MM-DD. "next weekend" resolves relative to today
(Saturday -> Tuesday, 3 nights). Pure heuristic, no I/O, no API key.
"""
import re
from datetime import date, timedelta

_KNOWN_DESTS = [
    "goa", "jaipur", "manali", "mumbai", "delhi", "london", "kerala",
    "udaipur", "agra", "varanasi", "rishikesh", "leh", "darjeeling",
    "coorg", "ooty", "pondicherry", "amritsar", "jaisalmer", "mysore",
    "bengaluru", "bangalore", "chennai", "hyderabad", "kolkata", "pune",
    "thailand", "bali", "dubai", "singapore", "paris", "new york",
]


def _next_weekend_sat() -> date:
    today = date.today()
    # Saturday = weekday 5
    days_ahead = (5 - today.weekday()) % 7
    if days_ahead == 0:  # today is Saturday -> next Saturday
        days_ahead = 7
    return today + timedelta(days=days_ahead)


def parse_nl_trip(text: str) -> dict:
    t = (text or "").strip()
    low = t.lower()
    out: dict = {}
    if not t:
        return out

    # ---- budget: "50k", "₹50,000", "1 lakh", "under 50000" ----
    m = re.search(r"₹?\s*(\d[\d,]*)\s*(lakh|lac|l|k|thousand)?", low)
    # prefer number near budget keywords
    bm = re.search(
        r"(?:under|below|within|budget|rs\.?|₹)\s*(\d[\d,]*)\s*(lakh|lac|l|k|thousand)?", low
    ) or re.search(r"(\d[\d,]*)\s*(lakh|lac)\b", low) or re.search(r"(\d+)\s*k\b", low)
    if bm:
        num = float(bm.group(1).replace(",", ""))
        unit = (bm.group(2) or "").lower()
        if unit in ("lakh", "lac", "l"):
            num *= 100000
        elif unit in ("k", "thousand"):
            num *= 1000
        elif num < 1000 and num > 0:  # bare "50" near budget words -> 50k
            num *= 1000
        if 5000 <= num <= 5000000:
            out["budget"] = int(num)
    elif m and ("budget" in low or "₹" in t or "rs" in low):
        num = float(m.group(1).replace(",", ""))
        unit = (m.group(2) or "").lower()
        if unit in ("lakh", "lac", "l"):
            num *= 100000
        elif unit in ("k", "thousand"):
            num *= 1000
        if 5000 <= num <= 5000000:
            out["budget"] = int(num)

    # ---- travelers: "2 people", "for 3", "couple", "solo" ----
    tm = re.search(r"(\d+)\s*(people|persons?|travellers?|travelers?|pax|adults?|members?)", low)
    if tm:
        n = max(1, min(9, int(tm.group(1))))
        out["travelers"] = n
    elif re.search(r"\bcouple\b|honeymoon|for two\b|2 of us", low):
        out["travelers"] = 2
    elif re.search(r"\bsolo\b|alone|just me\b", low):
        out["travelers"] = 1
    elif re.search(r"\bfamily of (\d)", low):
        out["travelers"] = max(1, min(9, int(re.search(r"\bfamily of (\d)", low).group(1))))

    # ---- origin: "from Delhi" ----
    om = re.search(r"\bfrom\s+([a-zA-Z]{3,20})", t)
    if om:
        out["origin"] = om.group(1).strip()

    # ---- destination: "to Goa" preferred, else known-dest scan ----
    dm = re.search(
        r"\bto\s+([A-Za-z][A-Za-z ]{2,24}?)(?:\s+(?:under|below|within|for|next|this|in|on|from|with|budget|cheap|saver|comfort|luxury|trip|₹)|\s+\d|[,.]|$)",
        t,
    )
    if dm:
        cand = dm.group(1).strip().rstrip(",.")
        if len(cand) >= 3:
            out["destination"] = cand.title()
    if "destination" not in out:
        for d in _KNOWN_DESTS:
            if re.search(rf"\b{re.escape(d)}\b", low):
                out["destination"] = d.title() if d != "new york" else "New York"
                break

    # ---- dates: ISO first, then "next weekend" / "this weekend" ----
    iso = re.findall(r"(\d{4}-\d{2}-\d{2})", t)
    if len(iso) >= 2:
        out["departure_date"], out["return_date"] = iso[0], iso[1]
    elif len(iso) == 1:
        out["departure_date"] = iso[0]
    elif "next weekend" in low:
        sat = _next_weekend_sat()
        out["departure_date"] = sat.isoformat()
        out["return_date"] = (sat + timedelta(days=3)).isoformat()
    elif "this weekend" in low:
        today = date.today()
        sat_offset = (5 - today.weekday()) % 7
        sat = today + timedelta(days=sat_offset)
        out["departure_date"] = sat.isoformat()
        out["return_date"] = (sat + timedelta(days=2)).isoformat()
    elif "next month" in low:
        today = date.today()
        first = date(today.year + (1 if today.month == 12 else 0),
                     1 if today.month == 12 else today.month + 1, 10)
        out["departure_date"] = first.isoformat()
        out["return_date"] = (first + timedelta(days=3)).isoformat()

    # ---- travel mode (comfort wins: bare "budget 50000" is not saver) ----
    if re.search(r"\b(luxury|comfort|premium|best|4\s*star|5\s*star)\b", low):
        out["travel_mode"] = "comfort"
    elif re.search(r"\b(cheap|cheapest|saver|low.?cost|backpacker)\b", low):
        out["travel_mode"] = "saver"

    # ---- diet hint (veg / jain / halal) — surfaced in UI, not sent to /api/plan ----
    diet = []
    if re.search(r"\bveg\b|vegetarian", low):
        diet.append("veg")
    if re.search(r"\bjain\b", low):
        diet.append("jain")
    if re.search(r"\bhalal\b", low):
        diet.append("halal")
    if diet:
        out["diet"] = ", ".join(diet)

    return out


def groq_parse_nl_trip(text: str, api_key: str, model: str) -> dict | None:
    """Ask Groq to return trip fields as JSON. None on any failure."""
    try:
        from groq import Groq
        import json as _json

        client = Groq(api_key=api_key)
        today = date.today().isoformat()
        completion = client.chat.completions.create(
            model=model,
            temperature=0,
            max_tokens=300,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"Extract trip search fields from the user text. Today is {today}. "
                        "Return ONLY a JSON object with any of these keys: origin (city or "
                        "IATA code), destination, departure_date (YYYY-MM-DD), return_date "
                        "(YYYY-MM-DD), travelers (1-9 int), budget (int rupees), "
                        "travel_mode (saver|balanced|comfort). Resolve 'next weekend' to "
                        "the upcoming Saturday + 3 nights. No other text."
                    ),
                },
                {"role": "user", "content": text[:500]},
            ],
        )
        raw = (completion.choices[0].message.content or "").strip()
        # strip code fences if present
        raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        data = _json.loads(raw)
        if not isinstance(data, dict):
            return None
        allowed = {"origin", "destination", "departure_date", "return_date",
                   "travelers", "budget", "travel_mode"}
        return {k: v for k, v in data.items() if k in allowed}
    except Exception:
        return None
