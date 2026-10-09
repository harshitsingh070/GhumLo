package com.ghoomlo.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ghoomlo.client.GroqClient;
import com.ghoomlo.dto.ParseTripReq;
import com.ghoomlo.service.NlParseService;
import com.ghoomlo.service.PackingService;
import jakarta.validation.Valid;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_parse_trip() + api_demo().
@RestController
@RequestMapping("/api")
public class ParseController {
  private static final Logger log = LoggerFactory.getLogger(ParseController.class);
  private final NlParseService nl;
  private final GroqClient groq;
  private final PackingService packing;
  private final ObjectMapper mapper = new ObjectMapper();
  private static Map<String, Object> demoCache = null;

  public ParseController(NlParseService nl, GroqClient groq, PackingService packing) {
    this.nl = nl;
    this.groq = groq;
    this.packing = packing;
  }

  @PostMapping("/parse-trip")
  public ResponseEntity<?> parse(@Valid @RequestBody ParseTripReq req) {
    // Rate limiting runs at the edge (RateLimitFilter, before validation).
    String text = req.text() == null ? "" : req.text();
    if (text.strip().length() < 2 || text.length() > 500) {
      return ResponseEntity.status(422).body(Map.of("error",
          "Couldn\u2019t understand that — try e.g. \u2018Goa under 50k next weekend, 2 people\u2019."));
    }
    Map<String, Object> heuristic = new LinkedHashMap<>(nl.parseNlTrip(text));
    String key = groq.apiKey();
    if (!key.isEmpty() && !key.equals("your_groq_key_here")) {
      Map<String, Object> refined = groq.refineNlTrip(text);
      if (refined != null) {
        for (Map.Entry<String, Object> e : refined.entrySet()) {
          if (e.getValue() != null && !"".equals(e.getValue())) heuristic.put(e.getKey(), e.getValue());
        }
        if (!refined.isEmpty()) heuristic.put("refined_by", "groq");
      }
    }
    if (heuristic.isEmpty()) {
      return ResponseEntity.status(422).body(Map.of("error",
          "Couldn\u2019t understand that — try e.g. \u2018Goa under 50k next weekend, 2 people\u2019."));
    }
    return ResponseEntity.ok(Map.of("fields", heuristic));
  }

  @GetMapping("/demo")
  public ResponseEntity<?> demo() {
    if (demoCache != null) return ResponseEntity.ok(demoCache);
    try (InputStream in = getClass().getResourceAsStream("/demo_goa.json")) {
      if (in == null) return ResponseEntity.status(502).body(Map.of("error", "Demo data unavailable"));
      Map<String, Object> data = mapper.readValue(in, new TypeReference<Map<String, Object>>() {});
      // Backfill the packing checklist so the demo shows the same
      // weather-aware section as live plans (zero searches — demo weather).
      try {
        if (!data.containsKey("packing")) {
          Object w = data.get("weather");
          @SuppressWarnings("unchecked")
          Map<String, Object> weather = w instanceof Map ? (Map<String, Object>) w : null;
          int nights = data.get("num_nights") instanceof Number
              ? ((Number) data.get("num_nights")).intValue() : 3;
          int travelers = data.get("travelers") instanceof Number
              ? ((Number) data.get("travelers")).intValue() : 2;
          data.put("packing", packing.buildPacking(weather, nights, travelers));
        }
      } catch (Exception e) {
        log.warn("demo packing backfill failed (omitted): {}", e.toString());
      }
      demoCache = data;
      return ResponseEntity.ok(demoCache);
    } catch (Exception e) {
      log.error("demo data failed", e);
      return ResponseEntity.status(502).body(Map.of("error", "Demo data unavailable: " + e.getMessage()));
    }
  }
}
