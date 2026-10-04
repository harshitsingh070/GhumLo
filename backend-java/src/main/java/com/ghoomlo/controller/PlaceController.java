package com.ghoomlo.controller;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.dto.PlacesReq;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_places()
@RestController
@RequestMapping("/api")
public class PlaceController {
  private static final Logger log = LoggerFactory.getLogger(PlaceController.class);
  private final SerpApiClient serp;

  public PlaceController(SerpApiClient serp) { this.serp = serp; }

  private String friendlyError(Exception e) {
    String msg = String.valueOf(e.getMessage());
    String low = msg.toLowerCase();
    if (low.contains("api_key") || low.contains("missing")) return "Server API key is missing. Add SERPAPI_API_KEY to .env (see .env.example).";
    if (low.contains("invalid api key") || low.contains("401") || low.contains("403")) return "SerpApi key is invalid. Check SERPAPI_API_KEY in .env.";
    if (low.contains("quota") || low.contains("429") || low.contains("limit")) return "SerpApi quota reached (free tier = 250 searches/mo). Try again later or reuse cached results.";
    return "Search temporarily failed. Please try again in a moment.";
  }

  @PostMapping("/places")
  public ResponseEntity<?> places(@RequestBody PlacesReq req) {
    try {
      String cat = req.category() == null ? "" : req.category().toLowerCase().strip();
      if (!cat.equals("attractions") && !cat.equals("restaurants")) {
        return ResponseEntity.status(400).body(Map.of("error", "category must be \u2018attractions\u2019 or \u2018restaurants\u2019"));
      }
      Map<String, Object> raw = serp.fetchPlacesRaw(req.location(), cat, req.force_refresh());
      List<Map<String, Object>> places = serp.parsePlaces(raw, cat);
      if (places.isEmpty()) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("places", List.of());
        out.put("message", "No " + cat + " found near " + req.location() + ".");
        return ResponseEntity.ok(out);
      }
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("places", places);
      out.put("from_cache", Boolean.TRUE.equals(raw.get("_from_cache")));
      return ResponseEntity.ok(out);
    } catch (Exception e) {
      log.error("places failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }
}
