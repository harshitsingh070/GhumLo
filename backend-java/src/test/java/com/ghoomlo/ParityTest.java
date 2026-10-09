package com.ghoomlo;

import com.ghoomlo.service.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ParityTest {
  @Autowired AirportResolver resolver;
  @Autowired BudgetService budget;
  @Autowired ItineraryService itinerary;
  @Autowired NlParseService nl;
  @Autowired InsightService insight;

  @Test
  void resolverParity() {
    assertEquals("DEL", resolver.resolveCityToAirport("DEL"));
    assertEquals("GOI", resolver.resolveCityToAirport("Goa"));
    assertEquals("LHR", resolver.resolveCityToAirport("London"));
    assertEquals("DEL", resolver.resolveCityToAirport("Delhi"));
    assertEquals("BOM", resolver.resolveCityToAirport("Mumbay"));
    assertEquals("LKO", resolver.resolveCityToAirport("lucnknow"));
    assertNull(resolver.resolveCityToAirport("XyzqwvNoCity"));
    assertEquals("IN", resolver.countryForCity("Goa"));
    // Tourist islands / countries -> gateway hubs (not dataset city names).
    assertEquals("DPS", resolver.resolveCityToAirport("Bali"));
    assertEquals("DPS", resolver.resolveCityToAirport("baali"));
    assertEquals("BKK", resolver.resolveCityToAirport("Thailand"));
    assertEquals("BKK", resolver.resolveCityToAirport("thai land"));
    assertEquals("HKT", resolver.resolveCityToAirport("Phuket"));
    assertEquals("MLE", resolver.resolveCityToAirport("Maldives"));
    assertEquals("DXB", resolver.resolveCityToAirport("Dubai"));
    assertEquals("TH", resolver.countryForCity("Thailand"));
    assertEquals("Bali", resolver.canonicalSearchLocation("Bali"));
    assertEquals("Dabolim", resolver.canonicalSearchLocation(" GOI "));
    assertEquals("New Delhi", resolver.canonicalSearchLocation("  New   Delhi  "));
  }

  @Test
  void difflibMatchesPython() {
    // Verified against CPython: SequenceMatcher(None,a,b).ratio()
    assertEquals(0.8333333333333334, AirportResolver.difflibRatio("mumbay", "mumbai"), 1e-9);
    assertEquals(0.9333333333333333, AirportResolver.difflibRatio("lucnknow", "lucknow"), 1e-9);
    assertEquals(1.0, AirportResolver.difflibRatio("", ""), 1e-9);
    assertEquals(0.0, AirportResolver.difflibRatio("", "goa"), 1e-9);
  }

  @Test
  void cacheKeyMatchesPython() throws Exception {
    // Python: json.dumps(params, sort_keys=True, default=str) + sha256[:16]
    Map<String, Object> p = new LinkedHashMap<>();
    p.put("engine", "google_flights");
    p.put("departure_id", "DEL");
    p.put("arrival_id", "BOM");
    p.put("outbound_date", "2026-10-10");
    p.put("currency", "INR");
    p.put("hl", "en");
    String blob = FileCacheService.pythonJsonDumps(p);
    assertEquals(
        "{\"arrival_id\": \"BOM\", \"currency\": \"INR\", \"departure_id\": \"DEL\", "
            + "\"engine\": \"google_flights\", \"hl\": \"en\", \"outbound_date\": \"2026-10-10\"}",
        blob);
    java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
    byte[] h = md.digest(blob.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    StringBuilder hex = new StringBuilder();
    for (byte b : h) hex.append(String.format("%02x", b));
    assertEquals("0016ff91be6556ca", hex.substring(0, 16));
  }

  @Test
  void budgetParity() {
    Map<String,Object> f1 = new LinkedHashMap<>(Map.of("airline","IndiGo","price",6200,"stops",0));
    Map<String,Object> f2 = new LinkedHashMap<>(Map.of("airline","Air India","price",9000,"stops",1));
    Map<String,Object> h1 = new LinkedHashMap<>(Map.of("name","Budget Stay","total_price",9000,"rating",4.0));
    Map<String,Object> h2 = new LinkedHashMap<>(Map.of("name","Luxury","total_price",27000,"rating",4.8));
    var match = budget.findBestCombination(List.of(f1,f2), List.of(h1,h2), 60000);
    assertEquals(true, match.get("fits_budget"));
    var alts = budget.buildModeAlternatives(List.of(f1,f2), List.of(h1,h2), 60000);
    assertEquals(3, alts.size());
    var over = budget.findBestCombination(List.of(f2), List.of(h2), 10000);
    assertEquals(false, over.get("fits_budget"));
    @SuppressWarnings("unchecked")
    var best = (Map<String,Object>) over.get("best_pick");
    var sugg = budget.generateSavingsSuggestions(List.of(f1,f2), List.of(h1,h2),
        (Map<String,Object>) best.get("flight"), (Map<String,Object>) best.get("hotel"),
        (int) best.get("over_by"), 3);
    assertTrue(sugg.size() <= 2);
  }

  @Test
  void itineraryParity() {
    Map<String,Object> a1 = new LinkedHashMap<>(Map.of("name","Fort","category","attractions","lat",15.5,"lng",73.8,"rating",4.5));
    Map<String,Object> r1 = new LinkedHashMap<>(Map.of("name","Cafe","category","restaurants","lat",15.51,"lng",73.81,"rating",4.2));
    var days = itinerary.buildItinerary(List.of(a1), List.of(r1), 2, 15.5, 73.8);
    assertEquals(2, days.size());
    assertTrue(days.get(0).containsKey("distance_km"));
  }

  @Test
  void nlParseParity() {
    var f = nl.parseNlTrip("Goa under 50k next weekend, 2 people, veg food");
    assertEquals("Goa", f.get("destination"));
    assertEquals(50000, f.get("budget"));
    assertEquals(2, f.get("travelers"));
    assertTrue(f.containsKey("departure_date"));
    // Generic-number fallback gated on budget context (colon breaks the
    // keyword-adjacent pattern but Python still finds the number).
    var g = nl.parseNlTrip("Goa trip budget: 45000 for 2 people");
    assertEquals(45000, g.get("budget"));
  }

  @Test
  void insightParity() {
    Map<String, Object> best = new LinkedHashMap<>();
    best.put("total_cost", 39400);
    Map<String, Object> place = new LinkedHashMap<>();
    place.put("rating", 4.5);
    Map<String, Object> d = new LinkedHashMap<>();
    d.put("distance_km", 4.2);
    d.put("places", List.of(place));
    String s = insight.generateTripInsight(best, 20600, 60000, List.of(d), true);
    assertTrue(s.contains("to spare"));
  }
}
