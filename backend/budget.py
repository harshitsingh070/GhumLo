"""Budget matching algorithm — pure function, no API calls.

For every flight x hotel combination:
    total = flight.price + hotel.total_price
Keep combos with total <= budget, sort ascending, pick cheapest.
If none fit, return the cheapest overall flagged as over-budget.
"""


def find_best_combination(flights: list[dict], hotels: list[dict], budget: int) -> dict:
    combos: list[dict] = []
    for f in flights:
        for h in hotels:
            total = f["price"] + h["total_price"]
            combos.append({"flight": f, "hotel": h, "total_cost": total})

    if not combos:
        return {"fits_budget": False, "best_pick": None,
                "candidates": [], "remaining_budget": 0}

    combos.sort(key=lambda c: c["total_cost"])
    within = [c for c in combos if c["total_cost"] <= budget]

    if within:
        best = within[0]
        return {
            "fits_budget": True,
            "best_pick": best,
            "candidates": within[:5],  # top-5 for UI "other options"
            "remaining_budget": budget - best["total_cost"],
        }
    cheapest = combos[0]
    return {
        "fits_budget": False,
        "best_pick": {**cheapest,
                      "over_by": cheapest["total_cost"] - budget},
        "candidates": [],
        "remaining_budget": 0,
    }


def _same_hotel(a: dict, b: dict) -> bool:
    return a.get("name") == b.get("name") and a.get("total_price") == b.get("total_price")


def _same_flight(a: dict, b: dict) -> bool:
    return (a.get("airline") == b.get("airline") and a.get("price") == b.get("price")
            and a.get("stops") == b.get("stops"))


def generate_savings_suggestions(
    flights: list[dict],
    hotels: list[dict],
    chosen_flight: dict,
    chosen_hotel: dict,
    over_by: int,
    num_nights: int,
) -> list[dict]:
    """Suggest up to 2 concrete, data-backed ways to close an over-budget gap.

    Only called when ``find_best_combination()`` returns ``fits_budget=False``;
    never called (and never in the response) for fitting plans. Every figure
    is computed from values already present in ``flights``/``hotels`` — no
    estimates, no new API calls, no quota cost.

    Candidate rules (each yields at most one suggestion, capped at 2 total,
    sorted by ``potential_savings`` descending):
      a. CHEAPER_HOTEL — the cheapest hotel in ``hotels`` (by ``total_price``,
         excluding the chosen one by name+price identity) swapped against the
         chosen flight. ``potential_savings`` = chosen_hotel total minus
         alternative total.
      b. CHEAPER_FLIGHT — the cheapest flight in ``flights`` (by ``price``,
         excluding the chosen one, and only with ``stops`` <= chosen flight's
         stops as a light quality filter) swapped against the chosen hotel.
         ``potential_savings`` = chosen_flight price minus alternative price.
      c. SHORTER_TRIP — only if ``num_nights`` > 1: dropping one night saves
         ``round(hotel_total / num_nights)`` (average nightly cost derived
         from the chosen hotel's own total, not invented). ``message`` names
         the exact ₹ figure.

    Honesty rule: if a suggestion's savings don't fully cover ``over_by``,
    its ``message`` says so explicitly ("would reduce the gap by ₹X but
    wouldn't fully close it"). If the chosen combo is already cheapest in
    both lists (or no candidate beats it), returns ``[]`` — never forced.

    Each item is ``{"type": "CHEAPER_HOTEL" | "CHEAPER_FLIGHT" | "SHORTER_TRIP",
    "message": str, "potential_savings": int}``. Pure function: no I/O.
    """
    if over_by <= 0:
        return []
    cands: list[dict] = []

    # a. Cheaper hotel.
    cheaper_hotels = sorted(
        (h for h in hotels
         if isinstance(h.get("total_price"), (int, float))
         and h["total_price"] < chosen_hotel.get("total_price", float("inf"))
         and not _same_hotel(h, chosen_hotel)),
        key=lambda h: h["total_price"],
    )
    if cheaper_hotels:
        alt = cheaper_hotels[0]
        save = int(chosen_hotel["total_price"] - alt["total_price"])
        if save > 0:
            verb = "would close the gap" if save >= over_by else (
                f"would reduce the gap by ₹{save:,} but wouldn't fully close it")
            cands.append({
                "type": "CHEAPER_HOTEL",
                "message": (f"Switch to {alt['name']} — saves ₹{save:,} and "
                            f"{verb}."),
                "potential_savings": save,
            })

    # b. Cheaper flight (equal or fewer stops only).
    try:
        max_stops = int(chosen_flight.get("stops", 99))
    except (ValueError, TypeError):
        max_stops = 99
    cheaper_flights = sorted(
        (f for f in flights
         if isinstance(f.get("price"), (int, float))
         and f["price"] < chosen_flight.get("price", float("inf"))
         and int(f.get("stops", 0)) <= max_stops
         and not _same_flight(f, chosen_flight)),
        key=lambda f: f["price"],
    )
    if cheaper_flights:
        alt = cheaper_flights[0]
        save = int(chosen_flight["price"] - alt["price"])
        if save > 0:
            verb = "would close the gap" if save >= over_by else (
                f"would reduce the gap by ₹{save:,} but wouldn't fully close it")
            cands.append({
                "type": "CHEAPER_FLIGHT",
                "message": (f"Switch to {alt['airline']} flight — saves ₹{save:,} "
                            f"({alt.get('stops', 0)} stop(s)) and {verb}."),
                "potential_savings": save,
            })

    # c. Shorter trip.
    if num_nights > 1 and isinstance(chosen_hotel.get("total_price"), (int, float)):
        save = int(round(chosen_hotel["total_price"] / num_nights))
        if save > 0:
            verb = "would close the gap" if save >= over_by else (
                f"would reduce the gap by ₹{save:,} but wouldn't fully close it")
            cands.append({
                "type": "SHORTER_TRIP",
                "message": (f"Book 1 fewer night ({num_nights - 1} instead of "
                            f"{num_nights}) — saves ≈₹{save:,} and {verb}."),
                "potential_savings": save,
            })

    cands.sort(key=lambda s: s["potential_savings"], reverse=True)
    return cands[:2]
