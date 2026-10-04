package com.ghoomlo.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

// Port of backend/itinerary.py — proximity-aware day clustering, pure functions.
@Service
public class ItineraryService {

  public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
    double r = 6371.0;
    double p1 = Math.toRadians(lat1), p2 = Math.toRadians(lat2);
    double dp = Math.toRadians(lat2 - lat1);
    double dl = Math.toRadians(lng2 - lng1);
    double a = Math.sin(dp / 2) * Math.sin(dp / 2)
        + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * r * Math.asin(Math.sqrt(a));
  }

  private static boolean hasCoords(Map<String, Object> p) {
    return p.get("lat") instanceof Number && p.get("lng") instanceof Number;
  }

  private static double dist(Map<String, Object> a, Map<String, Object> b) {
    if (!hasCoords(a) || !hasCoords(b)) return Double.POSITIVE_INFINITY;
    return haversineKm(((Number) a.get("lat")).doubleValue(), ((Number) a.get("lng")).doubleValue(),
        ((Number) b.get("lat")).doubleValue(), ((Number) b.get("lng")).doubleValue());
  }

  private static double distToPoint(Map<String, Object> p, double lat, double lng) {
    if (!hasCoords(p)) return Double.POSITIVE_INFINITY;
    return haversineKm(((Number) p.get("lat")).doubleValue(), ((Number) p.get("lng")).doubleValue(), lat, lng);
  }

  public static double dayRouteDistanceKm(List<Map<String, Object>> places) {
    if (places == null || places.size() < 2) return 0.0;
    double sum = 0;
    boolean any = false;
    for (int i = 0; i < places.size() - 1; i++) {
      double d = dist(places.get(i), places.get(i + 1));
      if (!Double.isInfinite(d)) { sum += d; any = true; }
    }
    if (!any) return 0.0;
    return Math.round(sum * 10.0) / 10.0;
  }

  private static Map<String, Object> day(int dayNum, List<Map<String, Object>> places) {
    Map<String, Object> d = new LinkedHashMap<>();
    d.put("day", dayNum);
    d.put("places", places);
    d.put("distance_km", dayRouteDistanceKm(places));
    return d;
  }

  // Mirrors cluster_places_by_proximity()
  public List<Map<String, Object>> clusterPlacesByProximity(List<Map<String, Object>> places,
      int numDays, int placesPerDay, Double hotelLat, Double hotelLng) {
    int n = Math.max(1, numDays);
    int ppp = Math.max(1, placesPerDay);
    List<Map<String, Object>> remaining = new ArrayList<>(places != null ? places : List.of());
    if (remaining.isEmpty()) {
      List<Map<String, Object>> out = new ArrayList<>();
      for (int i = 0; i < n; i++) out.add(day(i + 1, new ArrayList<>()));
      return out;
    }
    List<Map<String, Object>> geo = new ArrayList<>();
    List<Map<String, Object>> nongeo = new ArrayList<>();
    for (Map<String, Object> p : remaining) {
      if (hasCoords(p)) geo.add(p); else nongeo.add(p);
    }
    List<List<Map<String, Object>>> days = new ArrayList<>();
    List<Map<String, Object>> pool = new ArrayList<>(geo);
    for (int d = 0; d < n; d++) {
      if (pool.isEmpty()) break;
      Map<String, Object> seed;
      if (hotelLat != null && hotelLng != null && days.isEmpty()) {
        seed = pool.stream().min((a, b) -> Double.compare(distToPoint(a, hotelLat, hotelLng), distToPoint(b, hotelLat, hotelLng))).orElse(pool.get(0));
      } else {
        seed = pool.get(0);
      }
      pool.remove(seed);
      List<Map<String, Object>> cur = new ArrayList<>();
      cur.add(seed);
      while (cur.size() < ppp && !pool.isEmpty()) {
        Map<String, Object> last = cur.get(cur.size() - 1);
        Map<String, Object> nxt = pool.stream().min((a, b) -> Double.compare(dist(last, a), dist(last, b))).orElse(null);
        pool.remove(nxt);
        cur.add(nxt);
      }
      // mix fix
      java.util.Set<String> cats = new java.util.HashSet<>();
      for (Map<String, Object> p : cur) cats.add(String.valueOf(p.get("category")));
      for (String missing : List.of("restaurants", "attractions")) {
        if (!cats.contains(missing)) {
          List<Map<String, Object>> cand = new ArrayList<>();
          for (Map<String, Object> p : pool) {
            if (missing.equals(String.valueOf(p.get("category")))) cand.add(p);
          }
          if (!cand.isEmpty() && cur.size() > 1) {
            Map<String, Object> daySeed = cur.get(0);
            Map<String, Object> nearestNew = cand.stream().min((a, b) -> Double.compare(dist(daySeed, a), dist(daySeed, b))).orElse(null);
            List<Map<String, Object>> swappable = new ArrayList<>();
            for (int i = 1; i < cur.size(); i++) {
              if (!missing.equals(String.valueOf(cur.get(i).get("category")))) swappable.add(cur.get(i));
            }
            if (!swappable.isEmpty() && nearestNew != null) {
              Map<String, Object> victim = swappable.stream().max((a, b) -> Double.compare(dist(daySeed, a), dist(daySeed, b))).orElse(null);
              cur.remove(victim);
              pool.add(victim);
              pool.remove(nearestNew);
              cur.add(nearestNew);
              cats = new java.util.HashSet<>();
              for (Map<String, Object> p : cur) cats.add(String.valueOf(p.get("category")));
            }
          }
        }
      }
      days.add(cur);
    }
    for (Map<String, Object> p : new ArrayList<>(pool)) {
      List<Map<String, Object>> target = days.stream().min(java.util.Comparator.comparingInt(List::size)).orElse(null);
      if (target == null) { days.add(new ArrayList<>(List.of(p))); }
      else if (target.size() < ppp + 1) target.add(p);
      else days.add(new ArrayList<>(List.of(p)));
    }
    for (Map<String, Object> p : nongeo) {
      if (days.size() < n) days.add(new ArrayList<>(List.of(p)));
      else days.stream().min(java.util.Comparator.comparingInt(List::size)).orElse(days.get(0)).add(p);
    }
    while (days.size() < n) days.add(new ArrayList<>());
    List<Map<String, Object>> out = new ArrayList<>();
    for (int i = 0; i < Math.min(n, days.size()); i++) out.add(day(i + 1, days.get(i)));
    return out;
  }

  // Mirrors build_itinerary()
  public List<Map<String, Object>> buildItinerary(List<Map<String, Object>> attractions,
      List<Map<String, Object>> restaurants, int numNights, Double hotelLat, Double hotelLng) {
    int n = Math.max(1, numNights);
    List<Map<String, Object>> pool = new ArrayList<>();
    List<Map<String, Object>> a = new ArrayList<>(attractions != null ? attractions : List.of());
    List<Map<String, Object>> r = new ArrayList<>(restaurants != null ? restaurants : List.of());
    while (!a.isEmpty() || !r.isEmpty()) {
      if (!a.isEmpty()) pool.add(a.remove(0));
      if (!r.isEmpty()) pool.add(r.remove(0));
      if (!a.isEmpty()) pool.add(a.remove(0));
    }
    pool = pool.subList(0, Math.min(pool.size(), n * 3));
    return clusterPlacesByProximity(pool, n, 3, hotelLat, hotelLng);
  }
}
