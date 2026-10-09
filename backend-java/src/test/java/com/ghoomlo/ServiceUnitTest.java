package com.ghoomlo;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.service.AirportResolver;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// Fast offline unit tests: event date windows, safe arithmetic, suggestions.
class ServiceUnitTest {
  private final SerpApiClient client = new SerpApiClient(null, null, null, null);

  private static Map<String, Object> event(String title, String startDate) {
    Map<String, Object> ev = new LinkedHashMap<>();
    ev.put("title", title);
    Map<String, Object> date = new LinkedHashMap<>();
    if (startDate != null) date.put("start_date", startDate);
    ev.put("date", date);
    return ev;
  }

  private static Map<String, Object> eventsRaw(Map<String, Object>... events) {
    Map<String, Object> raw = new LinkedHashMap<>();
    raw.put("events_results", List.of(events));
    return raw;
  }

  private static List<String> titles(List<Map<String, Object>> events) {
    return events.stream().map(e -> String.valueOf(e.get("title"))).toList();
  }

  @Test
  void crossYearTripKeepsBothSidesEvents() {
    var raw = eventsRaw(event("NYE Party", "Dec 31"), event("New Year Brunch", "Jan 2"),
        event("Spring Fest", "Feb 5"));
    var kept = titles(client.parseEvents(raw, "2026-12-30", "2027-01-03"));
    assertTrue(kept.contains("NYE Party"), "Dec 31 must match a Dec 30 -> Jan 3 trip");
    assertTrue(kept.contains("New Year Brunch"), "Jan 2 must match a Dec 30 -> Jan 3 trip");
    assertFalse(kept.contains("Spring Fest"), "Feb 5 is outside the window");
  }

  @Test
  void sameYearWindowUnchanged() {
    var raw = eventsRaw(event("Mid Trip", "Oct 11"), event("Too Late", "Oct 20"), event("No Date", null));
    var kept = titles(client.parseEvents(raw, "2026-10-10", "2026-10-13"));
    assertTrue(kept.contains("Mid Trip"));
    assertFalse(kept.contains("Too Late"));
  }

  @Test
  void travelerOverflowNeverGoesNegative() {
    Map<String, Object> g = new LinkedHashMap<>();
    g.put("price", 50000);
    g.put("airline", "Test Air");
    Map<String, Object> raw = new LinkedHashMap<>();
    raw.put("flights_results", List.of(g));
    var maxed = client.parseFlights(raw, Integer.MAX_VALUE);
    assertEquals(1, maxed.size());
    assertTrue(((Number) maxed.get(0).get("price")).intValue() >= 0, "overflow must saturate, not wrap");
    var zero = client.parseFlights(raw, 0);
    assertEquals(50000, ((Number) zero.get(0).get("price")).intValue());
    var two = client.parseFlights(raw, 2);
    assertEquals(100000, ((Number) two.get(0).get("price")).intValue());
    assertEquals(Integer.MAX_VALUE, SerpApiClient.safeTotal(Integer.MAX_VALUE, 20));
    assertEquals(50, SerpApiClient.safeTotal(10, 5));
  }

  @Test
  void suggestionsHelpNearMissesButNotGarbage() {
    AirportResolver resolver = new AirportResolver();
    resolver.load();
    var near = resolver.suggestAirports("New Delhee", 3);
    assertFalse(near.isEmpty(), "near-miss should suggest");
    assertTrue(near.stream().anyMatch(e -> "DEL".equals(e.get("code"))));
    assertTrue(resolver.suggestAirports("XyzqwvNoCity", 3).isEmpty(), "garbage must yield nothing");
  }
}
