"""One-line trip insight — pure template generator, no I/O, no API calls.

Built entirely from numbers already computed in /api/plan. Every branch is
conditioned on real data; different trips produce different sentences.
"""


def _avg_rating(itinerary: list[dict]) -> float | None:
    ratings = [p["rating"] for d in (itinerary or [])
               for p in d.get("places", [])
               if isinstance(p.get("rating"), (int, float))]
    return round(sum(ratings) / len(ratings), 1) if ratings else None


def _avg_day_km(itinerary: list[dict]) -> float | None:
    kms = [d["distance_km"] for d in (itinerary or [])
           if isinstance(d.get("distance_km"), (int, float)) and d["distance_km"] > 0]
    return round(sum(kms) / len(kms), 1) if kms else None


def generate_trip_insight(best_pick: dict, remaining_budget: int, budget: int,
                          itinerary: list[dict], fits_budget: bool) -> str:
    """Return one natural-language sentence about this plan.

    Picks the two most relevant of three signals (budget headroom, place
    ratings, clustering tightness). Never crashes on missing/empty data —
    falls back to a plain factual sentence.
    """
    try:
        total = best_pick.get("total_cost") or 0
        if not budget or budget <= 0:
            return "Trip planned — see the breakdown below for details."
        if not fits_budget:
            over_by = best_pick.get("over_by")
            if over_by is None:
                over_by = max(0, total - budget)
            over_by = max(0, int(over_by))
            rating = _avg_rating(itinerary)
            if rating:
                return (f"Over budget by ₹{over_by:,}, but your stops still average "
                        f"{rating}★ if you adjust dates or hotel.")
            return (f"Over budget by ₹{over_by:,} — see the gap-closing ideas "
                    f"below to bring it within reach.")
        headroom_pct = round(remaining_budget / budget * 100)
        rating = _avg_rating(itinerary)
        avg_km = _avg_day_km(itinerary)
        spare = f"₹{int(remaining_budget):,}"
        if headroom_pct > 30:
            lead = f"Plenty of room — {spare} to spare"
        elif headroom_pct >= 10:
            lead = f"Comfortable fit — {spare} to spare"
        else:
            lead = f"Tight but doable — {spare} left"
        if rating and rating >= 4.0:
            return f"{lead}, and your stops average {rating}★."
        if avg_km is not None and avg_km <= 8:
            return f"{lead}; days are tightly clustered, minimal travel between stops."
        if rating:
            return f"{lead}, and your stops average {rating}★."
        return f"{lead}."
    except Exception:
        return "Trip planned — see the breakdown below for details."
