package com.ghoomlo.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

// Port of backend/insight.py — pure template generator, no I/O.
@Service
public class InsightService {

  private Double avgRating(List<Map<String, Object>> itinerary) {
    if (itinerary == null) return null;
    double sum = 0; int n = 0;
    for (Map<String, Object> d : itinerary) {
      Object places = d.get("places");
      if (!(places instanceof List)) continue;
      for (Object o : (List<?>) places) {
        if (!(o instanceof Map)) continue;
        Object r = ((Map<?, ?>) o).get("rating");
        if (r instanceof Number) { sum += ((Number) r).doubleValue(); n++; }
      }
    }
    if (n == 0) return null;
    return Math.round(sum / n * 10.0) / 10.0;
  }

  private Double avgDayKm(List<Map<String, Object>> itinerary) {
    if (itinerary == null) return null;
    double sum = 0; int n = 0;
    for (Map<String, Object> d : itinerary) {
      Object km = d.get("distance_km");
      if (km instanceof Number && ((Number) km).doubleValue() > 0) {
        sum += ((Number) km).doubleValue(); n++;
      }
    }
    if (n == 0) return null;
    return Math.round(sum / n * 10.0) / 10.0;
  }

  // Mirrors generate_trip_insight()
  public String generateTripInsight(Map<String, Object> bestPick, int remainingBudget,
      int budget, List<Map<String, Object>> itinerary, boolean fitsBudget) {
    try {
      int total = 0;
      if (bestPick != null && bestPick.get("total_cost") instanceof Number) {
        total = ((Number) bestPick.get("total_cost")).intValue();
      }
      if (budget <= 0) return "Trip planned — see the breakdown below for details.";
      if (!fitsBudget) {
        int overBy = 0;
        if (bestPick != null && bestPick.get("over_by") instanceof Number) {
          overBy = ((Number) bestPick.get("over_by")).intValue();
        } else {
          overBy = Math.max(0, total - budget);
        }
        overBy = Math.max(0, overBy);
        Double rating = avgRating(itinerary);
        if (rating != null) {
          return "Over budget by \u20B9" + String.format("%,d", overBy)
              + ", but your stops still average " + rating + "\u2605 if you adjust dates or hotel.";
        }
        return "Over budget by \u20B9" + String.format("%,d", overBy)
            + " — see the gap-closing ideas below to bring it within reach.";
      }
      int headroomPct = (int) Math.round(remainingBudget * 100.0 / budget);
      Double rating = avgRating(itinerary);
      Double avgKm = avgDayKm(itinerary);
      String spare = "\u20B9" + String.format("%,d", remainingBudget);
      String lead;
      if (headroomPct > 30) lead = "Plenty of room — " + spare + " to spare";
      else if (headroomPct >= 10) lead = "Comfortable fit — " + spare + " to spare";
      else lead = "Tight but doable — " + spare + " left";
      if (rating != null && rating >= 4.0) return lead + ", and your stops average " + rating + "\u2605.";
      if (avgKm != null && avgKm <= 8) return lead + "; days are tightly clustered, minimal travel between stops.";
      if (rating != null) return lead + ", and your stops average " + rating + "\u2605.";
      return lead + ".";
    } catch (Exception e) {
      return "Trip planned — see the breakdown below for details.";
    }
  }
}
