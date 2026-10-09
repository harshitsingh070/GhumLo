package com.ghoomlo.controller;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.dto.HotelsReq;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_hotels()
@RestController
@RequestMapping("/api")
public class HotelController {
  private static final Logger log = LoggerFactory.getLogger(HotelController.class);
  private final SerpApiClient serp;

  public HotelController(SerpApiClient serp) { this.serp = serp; }

  private int numNights(String d1, String d2) {
    try {
      long n = ChronoUnit.DAYS.between(LocalDate.parse(d1), LocalDate.parse(d2));
      return (int) Math.max(1, n);
    } catch (Exception e) { return 1; }
  }

  private String friendlyError(Exception e) {
    String msg = String.valueOf(e.getMessage());
    String low = msg.toLowerCase();
    if (low.contains("api_key") || low.contains("missing")) return "Server API key is missing. Add SERPAPI_API_KEY to .env (see .env.example).";
    if (low.contains("invalid api key") || low.contains("401") || low.contains("403")) return "SerpApi key is invalid. Check SERPAPI_API_KEY in .env.";
    if (low.contains("quota") || low.contains("429") || low.contains("limit")) return "SerpApi quota reached (free tier = 250 searches/mo). Try again later or reuse cached results.";
    return "Search temporarily failed. Please try again in a moment.";
  }

  @PostMapping("/hotels")
  public ResponseEntity<?> hotels(@Valid @RequestBody HotelsReq req) {
    // Rate limiting runs at the edge (RateLimitFilter, before validation).
    try {
      int travelers = Math.min(20, Math.max(1, req.travelers()));
      int nights = numNights(req.check_in(), req.check_out());
      if (nights > 90) {
        return ResponseEntity.status(422).body(Map.of("error",
            "Trip length must be 90 nights or fewer — try a shorter date range."));
      }
      Map<String, Object> raw = serp.fetchHotelsRaw(req.destination(), req.check_in(),
          req.check_out(), travelers, req.force_refresh());
      List<Map<String, Object>> hotels = serp.parseHotels(raw, nights);
      if (hotels.isEmpty()) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("hotels", List.of());
        out.put("message", "No hotels found for this destination/dates.");
        return ResponseEntity.ok(out);
      }
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("hotels", hotels);
      out.put("num_nights", nights);
      out.put("from_cache", Boolean.TRUE.equals(raw.get("_from_cache")));
      return ResponseEntity.ok(out);
    } catch (Exception e) {
      log.error("hotels failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }
}
