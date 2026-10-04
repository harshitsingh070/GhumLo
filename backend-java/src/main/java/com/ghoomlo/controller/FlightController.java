package com.ghoomlo.controller;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.dto.FlightsReq;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_flights()
@RestController
@RequestMapping("/api")
public class FlightController {
  private static final Logger log = LoggerFactory.getLogger(FlightController.class);
  private final SerpApiClient serp;

  public FlightController(SerpApiClient serp) { this.serp = serp; }

  private String friendlyError(Exception e) {
    String msg = String.valueOf(e.getMessage());
    String low = msg.toLowerCase();
    if (low.contains("api_key") || low.contains("missing")) return "Server API key is missing. Add SERPAPI_API_KEY to .env (see .env.example).";
    if (low.contains("invalid api key") || low.contains("401") || low.contains("403")) return "SerpApi key is invalid. Check SERPAPI_API_KEY in .env.";
    if (low.contains("quota") || low.contains("429") || low.contains("limit")) return "SerpApi quota reached (free tier = 250 searches/mo). Try again later or reuse cached results.";
    return "Search temporarily failed. Please try again in a moment.";
  }

  @PostMapping("/flights")
  public ResponseEntity<?> flights(@RequestBody FlightsReq req) {
    try {
      int travelers = req.travelers() <= 0 ? 1 : req.travelers();
      Map<String, Object> raw = serp.fetchFlightsRaw(req.origin(), req.destination(),
          req.departure_date(), req.return_date(), travelers, req.force_refresh());
      List<Map<String, Object>> flights = serp.parseFlights(raw, travelers);
      if (flights.isEmpty()) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("flights", List.of());
        out.put("message", "No flights found for these airports/dates.");
        return ResponseEntity.ok(out);
      }
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("flights", flights);
      out.put("from_cache", Boolean.TRUE.equals(raw.get("_from_cache")));
      return ResponseEntity.ok(out);
    } catch (IllegalArgumentException e) {
      String msg = String.valueOf(e.getMessage());
      if (msg.startsWith("unresolvable ")) {
        String bad = msg.contains(": ") ? msg.split(": ", 2)[1] : "that city";
        return ResponseEntity.status(400).body(Map.of("error",
            "Couldn\u2019t find an airport for \u2018" + bad + "\u2019 — try the 3-letter airport code instead (e.g. DEL, LHR, JFK)"));
      }
      log.error("flights failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    } catch (Exception e) {
      log.error("flights failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }
}
