"""Itinerary assembly — proximity-aware day clustering.

Upgrade history: the original even round-robin distributor (kept below as
_distribute_round_robin_deprecated) dealt places by index, so a day's 3 stops
could land on opposite sides of the city. The current build_itinerary() seeds
from the winning hotel and grows each day by greedy nearest-neighbor, so each
day's stops are actually near each other.
"""
import math


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Straight-line distance between two lat/lng points, in km."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _has_coords(p: dict) -> bool:
    return isinstance(p.get("lat"), (int, float)) and isinstance(p.get("lng"), (int, float))


def _dist(a: dict, b: dict) -> float:
    """Haversine distance between two places; infinity if either lacks coords."""
    if not (_has_coords(a) and _has_coords(b)):
        return float("inf")
    return haversine_km(a["lat"], a["lng"], b["lat"], b["lng"])


def _dist_to_point(p: dict, lat: float, lng: float) -> float:
    if not _has_coords(p):
        return float("inf")
    return haversine_km(p["lat"], p["lng"], lat, lng)


def day_route_distance_km(places: list[dict]) -> float:
    """Sum of haversine legs between consecutive stops. 0.0 for 0-1 stops."""
    legs = [_dist(places[i], places[i + 1])
            for i in range(len(places) - 1)]
    legs = [d for d in legs if d != float("inf")]
    return round(sum(legs), 1) if legs else 0.0


def cluster_places_by_proximity(
    places: list[dict],
    num_days: int,
    places_per_day: int = 3,
    hotel_lat: float | None = None,
    hotel_lng: float | None = None,
) -> list[dict]:
    """Group places into geographically compact day-clusters (greedy nearest-neighbor).

    Takes the combined attractions + restaurants list (each place carries
    ``lat``/``lng`` parsed from SerpApi ``gps_coordinates``; places without
    coords are appended last and never break clustering) and assigns them to
    ``num_days`` clusters of up to ``places_per_day`` stops, so each day's
    stops are near each other instead of spread by index.

    Approach (greedy, O(D * P^2) with D days and P places — trivial at
    MVP scale of ~40 places):
      1. Seed: the unassigned place closest to (hotel_lat, hotel_lng) if
         given, else the first unassigned place.
      2. Grow the day by repeatedly picking the unassigned place with the
         smallest haversine distance to the last place added.
      3. Mix fix: if a finished day has zero restaurants (or zero
         attractions) and one remains unassigned, swap the day's farthest
         same-category stop for the nearest unused place of the missing
         category. Proximity wins; the swap only repairs variety.
      4. Repeat for the next day until places or days run out.

    Why not optimal routing: full TSP / VRP-optimal sequencing is
    O(n!) per day and needs road-network distances, not straight-line
    estimates — overkill for a hackathon MVP where the goal is "stops that
    look sensibly grouped on a map," not turn-by-turn minimal mileage.
    Greedy nearest-neighbor gives visually and practically compact days at
    negligible cost; optimal routing is explicitly out of scope.

    Returns the same shape as the old round-robin builder — a list of
    ``{"day": int, "places": [...], "distance_km": float}`` dicts, where
    ``distance_km`` is the sum of haversine legs between consecutive stops
    within that day (0.0 for 0–1 stops), rounded to 1 decimal for the
    frontend "Day N — ~X.X km between stops" subtitle. Pure function:
    no I/O, no API calls.
    """
    n = max(1, num_days)
    ppp = max(1, places_per_day)
    remaining = list(places)
    if not remaining:
        return [{"day": i + 1, "places": [], "distance_km": 0.0} for i in range(n)]

    # Coord-less places can't cluster: hold them aside, append at the end.
    geo = [p for p in remaining if _has_coords(p)]
    nongeo = [p for p in remaining if not _has_coords(p)]

    days: list[list[dict]] = []
    pool = list(geo)
    for _ in range(n):
        if not pool:
            break
        # 1. Seed.
        if hotel_lat is not None and hotel_lng is not None and len(days) == 0:
            seed = min(pool, key=lambda p: _dist_to_point(p, hotel_lat, hotel_lng))
        else:
            seed = pool[0]
        pool.remove(seed)
        day = [seed]
        # 2. Grow by nearest-neighbor.
        while len(day) < ppp and pool:
            nxt = min(pool, key=lambda p: _dist(day[-1], p))
            pool.remove(nxt)
            day.append(nxt)
        # 3. Mix fix: ensure at least one restaurant AND one attraction per
        #    day when the unassigned pool can supply the missing category.
        cats = {p.get("category") for p in day}
        for missing in ("restaurants", "attractions"):
            if missing not in cats:
                cand = [p for p in pool if p.get("category") == missing]
                if cand and len(day) > 1:
                    # Swap out the day's farthest-from-seed swappable stop.
                    nearest_new = min(cand, key=lambda p: _dist(day[0], p))
                    swappable = [p for p in day[1:]
                                 if p.get("category") != missing]
                    if swappable:
                        victim = max(swappable, key=lambda p: _dist(day[0], p))
                        day.remove(victim)
                        pool.append(victim)
                        pool.remove(nearest_new)
                        day.append(nearest_new)
                        cats = {p.get("category") for p in day}
        days.append(day)

    # Leftover geo places (more places than days*ppp): pack round-robin onto
    # shortest days so nothing is silently dropped.
    for p in pool:
        target = min(days, key=len)
        if len(target) < ppp + 1:  # allow slight overflow rather than new day
            target.append(p)
        else:
            days.append([p])

    # Coord-less places: fill shortest days first.
    for p in nongeo:
        if len(days) < n:
            days.append([p])
        else:
            min(days, key=len).append(p)

    while len(days) < n:
        days.append([])

    return [{"day": i + 1, "places": d,
             "distance_km": day_route_distance_km(d)} for i, d in enumerate(days[:n])]


def _distribute_round_robin_deprecated(attractions: list[dict], restaurants: list[dict],
                                       num_nights: int) -> list[dict]:
    """Original even distributor, kept for reference (pre-clustering baseline).

    Interleaved attractions/restaurants by index and dealt them evenly across
    days, capped at 3/day. Simple and deterministic, but geography-blind: a
    day's stops could span the whole city. Superseded by
    cluster_places_by_proximity(); retained so the README can show the
    before/after upgrade story.
    """
    days: list[dict] = []
    n = max(1, num_nights)
    # Interleave: attraction, restaurant, attraction per day coverage
    pool: list[dict] = []
    a, r = list(attractions), list(restaurants)
    while a or r:
        if a:
            pool.append(a.pop(0))
        if r:
            pool.append(r.pop(0))
        if a:
            pool.append(a.pop(0))
    if not pool:
        return [{"day": i + 1, "places": []} for i in range(n)]
    # Cap at 3 per day so 40 places don't dump 14/day on the UI.
    pool = pool[: n * 3]
    per_day = max(2, (len(pool) + n - 1) // n)
    per_day = min(3, per_day)
    for i in range(n):
        chunk = pool[i * per_day:(i + 1) * per_day]
        if not chunk and pool:  # more days than places: wrap around
            chunk = [pool[i % len(pool)]]
        days.append({"day": i + 1, "places": chunk})
    return days


def build_itinerary(attractions: list[dict], restaurants: list[dict],
                    num_nights: int,
                    hotel_lat: float | None = None,
                    hotel_lng: float | None = None) -> list[dict]:
    """Assemble day-clustered itinerary (proximity-aware, capped at 3/day)."""
    n = max(1, num_nights)
    pool: list[dict] = []
    a, r = list(attractions), list(restaurants)
    while a or r:
        if a:
            pool.append(a.pop(0))
        if r:
            pool.append(r.pop(0))
        if a:
            pool.append(a.pop(0))
    pool = pool[: n * 3]
    return cluster_places_by_proximity(pool, n, 3, hotel_lat, hotel_lng)
