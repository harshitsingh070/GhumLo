package com.ghoomlo.controller;

import com.ghoomlo.client.GroqClient;
import com.ghoomlo.dto.AssistantReq;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_assistant() with guardrails.
@RestController
@RequestMapping("/api")
public class AssistantController {
  private static final Logger log = LoggerFactory.getLogger(AssistantController.class);
  private static final String SCOPE_MSG = "I can only help with this trip — flights and prices in your plan, "
      + "itinerary changes, timing, food near your stops, packing, weather, or transport "
      + "between stops. What would you like to adjust?";

  private final GroqClient groq;

  private static final List<Pattern> OFF_TOPIC = List.of(
      Pattern.compile("ignor(e|ing)\\s+(all\\s+|previous\\s+|prior\\s+|above\\s+)?(instructions|rules|prompts)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("disregard\\s+(all\\s+|previous\\s+|your\\s+)?(instructions|rules)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(reveal|show|print|repeat).{0,30}(system\\s+prompt|instructions|prompt)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\b(jailbreak|DAN\\s+mode|do anything now)\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\b(write|generate|create)\\b.{0,40}\\b(code|program|script|function|class|python|javascript|sql query)\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\b(essay|assignment|homework|thesis)\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\bexam\\s+answers?\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\bsolve\\b.{0,30}\\b(my\\s+homework|my\\s+assignment|this\\s+exam)\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("\\b(write|compose).{0,30}\\b(poem|poetry|story|novel|song lyrics)\\b", Pattern.CASE_INSENSITIVE));

  public AssistantController(GroqClient groq) { this.groq = groq; }

  private boolean offTopic(String text) {
    if (text == null) return false;
    for (Pattern p : OFF_TOPIC) if (p.matcher(text).find()) return true;
    return false;
  }

  private static String capped(Object v, int max) {
    String s = String.valueOf(v);
    return s.length() > max ? s.substring(0, max) + "…" : s;
  }

  private static List<Map<String, Object>> boundItinerary(List<Map<String, Object>> itin) {
    List<Map<String, Object>> out = new java.util.ArrayList<>();
    if (itin == null) return out;
    for (Map<String, Object> e : itin.subList(0, Math.min(30, itin.size()))) {
      if (e == null) continue;
      Map<String, Object> c = new java.util.LinkedHashMap<>();
      for (Map.Entry<String, Object> en : e.entrySet()) {
        if (c.size() >= 12) break;
        Object v = en.getValue();
        c.put(en.getKey(), v instanceof String ? capped(v, 300) : v);
      }
      out.add(c);
    }
    return out;
  }

  private static Map<String, Object> boundWeather(Map<String, Object> weather) {
    Map<String, Object> out = new java.util.LinkedHashMap<>();
    if (weather == null) return out;
    for (Map.Entry<String, Object> en : weather.entrySet()) {
      if (out.size() >= 25) break;
      Object v = en.getValue();
      out.put(en.getKey(), v instanceof String ? capped(v, 400) : v);
    }
    return out;
  }

  @PostMapping("/assistant")
  public ResponseEntity<?> assistant(@Valid @RequestBody AssistantReq req) {
    // Rate limiting runs at the edge (RateLimitFilter, before validation).
    if (offTopic(req.request()) || offTopic(req.destination())
        || (req.dates() != null && offTopic(req.dates()))) {
      return ResponseEntity.status(400).body(Map.of("error", SCOPE_MSG));
    }
    // Bound every user-controlled blob before it becomes model context:
    // per-entry string caps, key-count caps, and a total size cap. Oversize
    // input is rejected (422) rather than billed to our Groq key.
    List<Map<String, Object>> boundedItin = boundItinerary(req.itinerary());
    Map<String, Object> boundedWeather = boundWeather(req.weather());
    Object tripPrices = req.tripPrices();
    if (tripPrices != null && String.valueOf(tripPrices).length() > 8000) {
      return ResponseEntity.status(422).body(Map.of("error",
          "Trip context too large — ask about a smaller part of the trip."));
    }
    int totalCtx = String.valueOf(boundedItin).length()
        + String.valueOf(boundedWeather).length()
        + (tripPrices == null ? 0 : String.valueOf(tripPrices).length());
    if (totalCtx > 20000) {
      return ResponseEntity.status(422).body(Map.of("error",
          "Trip context too large — ask about a smaller part of the trip."));
    }
    String key = groq.apiKey();
    if (key.isEmpty() || key.equals("your_groq_key_here")) {
      return ResponseEntity.status(503).body(Map.of("error",
          "Groq is not configured yet. Add GROQ_API_KEY to your .env file and restart the server."));
    }
    // Manual guard matching Pydantic limits (422 like FastAPI validation
    // errors — distinct from the 400 off-topic scope refusal above).
    if (req.destination() == null || req.destination().isBlank()
        || req.destination().length() > 100
        || req.request() == null || req.request().length() < 2 || req.request().length() > 600
        || (req.dates() != null && req.dates().length() > 80)
        || (req.itinerary() != null && req.itinerary().size() > 30)) {
      return ResponseEntity.status(422).body(Map.of("error",
          "Invalid request — check destination (1-100 chars), request (2-600 chars), "
              + "dates (max 80 chars) and itinerary (max 30 stops)."));
    }
    try {
      Map<String, Object> out = groq.askAssistant(req.destination(),
          req.dates() == null ? "" : req.dates(), req.request(),
          boundedItin, boundedWeather,
          req.tripPrices());
      return ResponseEntity.ok(out);
    } catch (Exception e) {
      log.error("Groq assistant failed", e);
      return ResponseEntity.status(502).body(Map.of("error",
          "The travel assistant is temporarily unavailable. Check your Groq key and try again."));
    }
  }
}
