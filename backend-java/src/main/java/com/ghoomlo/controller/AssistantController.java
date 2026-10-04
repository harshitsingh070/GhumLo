package com.ghoomlo.controller;

import com.ghoomlo.client.GroqClient;
import com.ghoomlo.dto.AssistantReq;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
  private static final int RATE_MAX = 15;
  private static final long RATE_WINDOW_MS = 600_000L;

  private final GroqClient groq;
  private final ConcurrentHashMap<String, List<Long>> hits = new ConcurrentHashMap<>();

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

  private synchronized boolean rateOk(String ip) {
    long now = System.currentTimeMillis();
    List<Long> list = hits.getOrDefault(ip, new ArrayList<>());
    List<Long> recent = new ArrayList<>();
    for (Long t : list) if (now - t < RATE_WINDOW_MS) recent.add(t);
    if (recent.size() >= RATE_MAX) {
      hits.put(ip, recent);
      return false;
    }
    recent.add(now);
    hits.put(ip, recent);
    if (hits.size() > 5000) hits.clear();
    return true;
  }

  private boolean offTopic(String text) {
    if (text == null) return false;
    for (Pattern p : OFF_TOPIC) if (p.matcher(text).find()) return true;
    return false;
  }

  @PostMapping("/assistant")
  public ResponseEntity<?> assistant(@Valid @RequestBody AssistantReq req, HttpServletRequest http) {
    String ip = http.getRemoteAddr() == null ? "unknown" : http.getRemoteAddr();
    if (http.getHeader("X-Forwarded-For") != null) ip = http.getHeader("X-Forwarded-For").split(",")[0].strip();
    if (!rateOk(ip)) {
      return ResponseEntity.status(429).body(Map.of("error",
          "Too many assistant requests — please wait a few minutes and try again."));
    }
    if (offTopic(req.request())) {
      return ResponseEntity.status(400).body(Map.of("error", SCOPE_MSG));
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
          req.itinerary() == null ? List.of() : req.itinerary(),
          req.weather() == null ? Map.of() : req.weather(),
          req.tripPrices());
      return ResponseEntity.ok(out);
    } catch (Exception e) {
      log.error("Groq assistant failed", e);
      return ResponseEntity.status(502).body(Map.of("error",
          "The travel assistant is temporarily unavailable. Check your Groq key and try again."));
    }
  }
}
