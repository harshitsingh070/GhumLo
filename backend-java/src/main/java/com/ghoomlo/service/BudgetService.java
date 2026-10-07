package com.ghoomlo.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

// Port of backend/budget.py — pure functions, no I/O.
@Service
public class BudgetService {

  private static int intOf(Object v, int def) {
    if (v instanceof Number n) return n.intValue();
    try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return def; }
  }

  private static double doubleOf(Object v, double def) {
    if (v instanceof Number n) return n.doubleValue();
    try { return Double.parseDouble(String.valueOf(v).split(" ")[0]); } catch (Exception e) { return def; }
  }

  private static int totalOf(Map<String, Object> flight, Map<String, Object> hotel) {
    return intOf(flight.get("price"), 0) + intOf(hotel.get("total_price"), 0);
  }

  @SuppressWarnings("unchecked")
  private static Map<String, Object> combo(Map<String, Object> f, Map<String, Object> h, int total) {
    Map<String, Object> c = new LinkedHashMap<>();
    c.put("flight", f);
    c.put("hotel", h);
    c.put("total_cost", total);
    return c;
  }

  // Mirrors find_best_combination()
  public Map<String, Object> findBestCombination(List<Map<String, Object>> flights,
      List<Map<String, Object>> hotels, int budget) {
    List<Map<String, Object>> combos = new ArrayList<>();
    for (Map<String, Object> f : flights) {
      for (Map<String, Object> h : hotels) {
        combos.add(combo(f, h, totalOf(f, h)));
      }
    }
    Map<String, Object> out = new LinkedHashMap<>();
    if (combos.isEmpty()) {
      out.put("fits_budget", false);
      out.put("best_pick", null);
      out.put("candidates", List.of());
      out.put("remaining_budget", 0);
      return out;
    }
    combos.sort(Comparator.comparingInt(c -> intOf(c.get("total_cost"), Integer.MAX_VALUE)));
    List<Map<String, Object>> within = combos.stream()
        .filter(c -> intOf(c.get("total_cost"), Integer.MAX_VALUE) <= budget).toList();
    if (!within.isEmpty()) {
      Map<String, Object> best = within.get(0);
      out.put("fits_budget", true);
      out.put("best_pick", best);
      out.put("candidates", within.subList(0, Math.min(5, within.size())));
      out.put("remaining_budget", budget - intOf(best.get("total_cost"), budget));
      return out;
    }
    Map<String, Object> cheapest = combos.get(0);
    Map<String, Object> bestPick = new LinkedHashMap<>(cheapest);
    bestPick.put("over_by", intOf(cheapest.get("total_cost"), 0) - budget);
    out.put("fits_budget", false);
    out.put("best_pick", bestPick);
    out.put("candidates", List.of());
    out.put("remaining_budget", 0);
    return out;
  }

  // Mirrors rank_combinations()
  public List<Map<String, Object>> rankCombinations(List<Map<String, Object>> flights,
      List<Map<String, Object>> hotels, int budget, String mode) {
    List<Map<String, Object>> combos = new ArrayList<>();
    for (Map<String, Object> f : flights) {
      for (Map<String, Object> h : hotels) {
        combos.add(combo(f, h, totalOf(f, h)));
      }
    }
    if (combos.isEmpty()) return List.of();
    List<Map<String, Object>> fitting = combos.stream()
        .filter(c -> intOf(c.get("total_cost"), Integer.MAX_VALUE) <= budget).toList();
    String m = mode == null ? "balanced" : mode;
    if (fitting.isEmpty()) {
      // Over budget: still rank by the selected mode (cheapest for saver,
      // best-rated for comfort) instead of cheapest-for-everyone.
      List<Map<String, Object>> all = new ArrayList<>(combos);
      all.sort((a, b) -> {
        double[] sa = score(a, m);
        double[] sb = score(b, m);
        for (int i = 0; i < sa.length; i++) {
          int cmp = Double.compare(sa[i], sb[i]);
          if (cmp != 0) return cmp;
        }
        return 0;
      });
      return all.subList(0, Math.min(3, all.size()));
    }
    fitting = new ArrayList<>(fitting);
    fitting.sort((a, b) -> {
      double[] sa = score(a, m);
      double[] sb = score(b, m);
      for (int i = 0; i < sa.length; i++) {
        int cmp = Double.compare(sa[i], sb[i]);
        if (cmp != 0) return cmp;
      }
      return 0;
    });
    return fitting.subList(0, Math.min(3, fitting.size()));
  }

  // Mirrors budget.py score(): float tuple, no truncation — Double.compare
  // preserves Python's tuple ordering including fractional rating terms.
  private double[] score(Map<String, Object> combo, String mode) {
    @SuppressWarnings("unchecked")
    Map<String, Object> flight = (Map<String, Object>) combo.get("flight");
    @SuppressWarnings("unchecked")
    Map<String, Object> hotel = (Map<String, Object>) combo.get("hotel");
    double rating = doubleOf(hotel.get("rating"), 0);
    int stops;
    try { stops = Integer.parseInt(String.valueOf(flight.getOrDefault("stops", 0))); }
    catch (Exception e) { stops = 0; }
    int total = intOf(combo.get("total_cost"), 0);
    if ("saver".equals(mode)) {
      return new double[]{total, -rating};
    }
    if ("comfort".equals(mode)) {
      return new double[]{-rating, stops, total};
    }
    double balanced = total + stops * 2500 + Math.max(0, 4.2 - rating) * 4000;
    return new double[]{balanced, total};
  }

  // Mirrors build_mode_alternatives() — one DISTINCT pick per mode with a
  // concrete selection rule each user can verify:
  //   saver    = cheapest total (fitting if any fit, else cheapest overall)
  //   balanced = cheapest cost+stops+rating tradeoff (same fitting rule)
  //   comfort  = highest-rated stay (fitting if any fit, else best-rated overall)
  // Picks are de-duplicated across modes (walk down the mode ranking past
  // combos already taken), so identical cards can only happen when the live
  // data genuinely contains a single flight+hotel combination.
  public List<Map<String, Object>> buildModeAlternatives(List<Map<String, Object>> flights,
      List<Map<String, Object>> hotels, int budget) {
    List<Map<String, Object>> combos = new ArrayList<>();
    for (Map<String, Object> f : flights) {
      for (Map<String, Object> h : hotels) {
        combos.add(combo(f, h, totalOf(f, h)));
      }
    }
    if (combos.isEmpty()) return List.of();
    List<Map<String, Object>> out = new ArrayList<>();
    List<String> taken = new ArrayList<>();
    for (String mode : List.of("saver", "balanced", "comfort")) {
      List<Map<String, Object>> ranked = new ArrayList<>(combos);
      final String m = mode;
      ranked.sort((a, b) -> {
        double[] sa = score(a, m);
        double[] sb = score(b, m);
        for (int i = 0; i < sa.length; i++) {
          int cmp = Double.compare(sa[i], sb[i]);
          if (cmp != 0) return cmp;
        }
        return 0;
      });
      // Prefer a fitting combo the mode hasn't already lost to another tier…
      Map<String, Object> choice = null;
      for (Map<String, Object> c : ranked) {
        if (intOf(c.get("total_cost"), Integer.MAX_VALUE) <= budget && !taken.contains(keyOf(c))) {
          choice = c;
          break;
        }
      }
      // …then any untaken combo in mode order (this is what makes the
      // over-budget tiers differ: cheapest vs best-rated vs tradeoff)…
      if (choice == null) {
        for (Map<String, Object> c : ranked) {
          if (!taken.contains(keyOf(c))) { choice = c; break; }
        }
      }
      // …and only if the data holds a single combination do tiers repeat it.
      if (choice == null) choice = ranked.get(0);
      taken.add(keyOf(choice));
      Map<String, Object> alt = new LinkedHashMap<>();
      alt.put("mode", mode);
      alt.putAll(choice);
      alt.put("fits_budget", intOf(choice.get("total_cost"), Integer.MAX_VALUE) <= budget);
      out.add(alt);
    }
    return out;
  }

  private String keyOf(Map<String, Object> combo) {
    @SuppressWarnings("unchecked")
    Map<String, Object> f = (Map<String, Object>) combo.get("flight");
    @SuppressWarnings("unchecked")
    Map<String, Object> h = (Map<String, Object>) combo.get("hotel");
    return String.valueOf(f.get("airline")) + "|" + intOf(f.get("price"), -1)
        + "|" + String.valueOf(h.get("name")) + "|" + intOf(h.get("total_price"), -1);
  }

  private boolean sameHotel(Map<String, Object> a, Map<String, Object> b) {
    return String.valueOf(a.get("name")).equals(String.valueOf(b.get("name")))
        && intOf(a.get("total_price"), -1) == intOf(b.get("total_price"), -2);
  }

  private boolean sameFlight(Map<String, Object> a, Map<String, Object> b) {
    return String.valueOf(a.get("airline")).equals(String.valueOf(b.get("airline")))
        && intOf(a.get("price"), -1) == intOf(b.get("price"), -2)
        && intOf(a.get("stops"), -1) == intOf(b.get("stops"), -2);
  }

  // Mirrors generate_savings_suggestions()
  public List<Map<String, Object>> generateSavingsSuggestions(List<Map<String, Object>> flights,
      List<Map<String, Object>> hotels, Map<String, Object> chosenFlight,
      Map<String, Object> chosenHotel, int overBy, int numNights) {
    List<Map<String, Object>> cands = new ArrayList<>();
    if (overBy <= 0) return cands;

    // a. cheaper hotel
    int chosenHotelTotal = intOf(chosenHotel.get("total_price"), Integer.MAX_VALUE);
    Map<String, Object> cheapestHotel = null;
    for (Map<String, Object> h : hotels) {
      Object tp = h.get("total_price");
      if (!(tp instanceof Number)) continue;
      int t = ((Number) tp).intValue();
      if (t < chosenHotelTotal && !sameHotel(h, chosenHotel)) {
        if (cheapestHotel == null || t < intOf(cheapestHotel.get("total_price"), Integer.MAX_VALUE)) {
          cheapestHotel = h;
        }
      }
    }
    if (cheapestHotel != null) {
      int save = chosenHotelTotal - intOf(cheapestHotel.get("total_price"), chosenHotelTotal);
      if (save > 0) {
        String verb = save >= overBy ? "would close the gap"
            : "would reduce the gap by \u20B9" + String.format("%,d", save) + " but wouldn\u2019t fully close it";
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("type", "CHEAPER_HOTEL");
        s.put("message", "Switch to " + cheapestHotel.get("name") + " — saves \u20B9"
            + String.format("%,d", save) + " and " + verb + ".");
        s.put("potential_savings", save);
        cands.add(s);
      }
    }

    // b. cheaper flight with <= stops
    int maxStops;
    try { maxStops = Integer.parseInt(String.valueOf(chosenFlight.getOrDefault("stops", 99))); }
    catch (Exception e) { maxStops = 99; }
    int chosenPrice = intOf(chosenFlight.get("price"), Integer.MAX_VALUE);
    Map<String, Object> cheapestFlight = null;
    for (Map<String, Object> f : flights) {
      Object pr = f.get("price");
      if (!(pr instanceof Number)) continue;
      int p = ((Number) pr).intValue();
      int st;
      try { st = Integer.parseInt(String.valueOf(f.getOrDefault("stops", 0))); }
      catch (Exception e) { continue; }
      if (p < chosenPrice && st <= maxStops && !sameFlight(f, chosenFlight)) {
        if (cheapestFlight == null || p < intOf(cheapestFlight.get("price"), Integer.MAX_VALUE)) {
          cheapestFlight = f;
        }
      }
    }
    if (cheapestFlight != null) {
      int save = chosenPrice - intOf(cheapestFlight.get("price"), chosenPrice);
      if (save > 0) {
        String verb = save >= overBy ? "would close the gap"
            : "would reduce the gap by \u20B9" + String.format("%,d", save) + " but wouldn\u2019t fully close it";
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("type", "CHEAPER_FLIGHT");
        s.put("message", "Switch to " + cheapestFlight.get("airline") + " flight — saves \u20B9"
            + String.format("%,d", save) + " (" + cheapestFlight.getOrDefault("stops", 0)
            + " stop(s)) and " + verb + ".");
        s.put("potential_savings", save);
        cands.add(s);
      }
    }

    // c. shorter trip
    if (numNights > 1 && chosenHotel.get("total_price") instanceof Number) {
      int save = (int) Math.round(((Number) chosenHotel.get("total_price")).doubleValue() / numNights);
      if (save > 0) {
        String verb = save >= overBy ? "would close the gap"
            : "would reduce the gap by \u20B9" + String.format("%,d", save) + " but wouldn\u2019t fully close it";
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("type", "SHORTER_TRIP");
        s.put("message", "Book 1 fewer night (" + (numNights - 1) + " instead of "
            + numNights + ") — saves \u2248\u20B9" + String.format("%,d", save) + " and " + verb + ".");
        s.put("potential_savings", save);
        cands.add(s);
      }
    }

    cands.sort((a, b) -> Integer.compare(intOf(b.get("potential_savings"), 0), intOf(a.get("potential_savings"), 0)));
    return cands.subList(0, Math.min(2, cands.size()));
  }
}
