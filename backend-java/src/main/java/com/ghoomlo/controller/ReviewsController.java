package com.ghoomlo.controller;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.dto.HotelReviewsReq;
import com.ghoomlo.dto.PlaceReviewsReq;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Lazy on-expand reviews — exactly 1 SerpApi search per call, 24h cached.
// NEVER called inside /api/plan: the frontend only hits these when the user
// expands a hotel or place card, keeping the core plan at 4 searches.
@RestController
@RequestMapping("/api")
public class ReviewsController {
  private static final Logger log = LoggerFactory.getLogger(ReviewsController.class);
  private final SerpApiClient serp;

  public ReviewsController(SerpApiClient serp) { this.serp = serp; }

  private String friendlyError(Exception e) {
    String msg = String.valueOf(e.getMessage());
    String low = msg.toLowerCase();
    if (low.contains("api_key") || low.contains("missing")) return "Server API key is missing. Add SERPAPI_API_KEY to .env (see .env.example).";
    if (low.contains("invalid api key") || low.contains("401") || low.contains("403")) return "SerpApi key is invalid. Check SERPAPI_API_KEY in .env.";
    if (low.contains("quota") || low.contains("429") || low.contains("limit")) return "SerpApi quota reached (free tier = 250 searches/mo). Try again later or reuse cached results.";
    return "Search temporarily failed. Please try again in a moment.";
  }

  private ResponseEntity<?> backoffResponse(String what) {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("reviews", List.of());
    out.put("count", 0);
    out.put("from_cache", false);
    out.put("from_backoff", true);
    out.put("message", what + " temporarily unavailable — please try again later (no quota used).");
    return ResponseEntity.ok(out);
  }

  @PostMapping("/hotels/reviews")
  public ResponseEntity<?> hotelReviews(@RequestBody HotelReviewsReq req) {
    try {
      String token = req == null || req.property_token() == null ? "" : req.property_token().strip();
      if (token.isEmpty()) {
        return ResponseEntity.status(400).body(Map.of("error",
            "property_token is required — pick it from a hotel in /api/hotels or /api/plan (property_token)."));
      }
      boolean fr = req.force_refresh();
      Map<String, Object> raw = serp.fetchHotelReviewsRaw(token, fr);
      List<Map<String, Object>> reviews = serp.parseHotelReviews(raw, 5);
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("reviews", reviews);
      out.put("count", reviews.size());
      out.put("from_cache", Boolean.TRUE.equals(raw.get("_from_cache")));
      if (reviews.isEmpty()) {
        out.put("message", "No reviews found for this hotel yet.");
      }
      return ResponseEntity.ok(out);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(400).body(Map.of("error", String.valueOf(e.getMessage())));
    } catch (RuntimeException e) {
      if (String.valueOf(e.getMessage()).toLowerCase().contains("backoff")) {
        return backoffResponse("Hotel reviews");
      }
      log.error("hotel reviews failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    } catch (Exception e) {
      log.error("hotel reviews failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }

  @PostMapping("/places/reviews")
  public ResponseEntity<?> placeReviews(@RequestBody PlaceReviewsReq req) {
    try {
      String pid = req == null || req.place_id() == null ? "" : req.place_id().strip();
      String did = req == null || req.data_id() == null ? "" : req.data_id().strip();
      if (pid.isEmpty() && did.isEmpty()) {
        return ResponseEntity.status(400).body(Map.of("error",
            "place_id (or data_id) is required — pick it from a place in /api/places or /api/plan."));
      }
      boolean fr = req.force_refresh();
      Map<String, Object> raw = serp.fetchPlaceReviewsRaw(pid, did, fr);
      List<Map<String, Object>> reviews = serp.parsePlaceReviews(raw, 5);
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("reviews", reviews);
      out.put("count", reviews.size());
      out.put("from_cache", Boolean.TRUE.equals(raw.get("_from_cache")));
      if (reviews.isEmpty()) {
        out.put("message", "No reviews found for this place yet.");
      }
      return ResponseEntity.ok(out);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(400).body(Map.of("error", String.valueOf(e.getMessage())));
    } catch (RuntimeException e) {
      if (String.valueOf(e.getMessage()).toLowerCase().contains("backoff")) {
        return backoffResponse("Place reviews");
      }
      log.error("place reviews failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    } catch (Exception e) {
      log.error("place reviews failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }
}
