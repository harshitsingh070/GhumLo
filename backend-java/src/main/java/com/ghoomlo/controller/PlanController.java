package com.ghoomlo.controller;

import com.ghoomlo.client.SerpApiClient;
import com.ghoomlo.dto.PlanReq;
import com.ghoomlo.service.AirportResolver;
import com.ghoomlo.service.BudgetService;
import com.ghoomlo.service.InsightService;
import com.ghoomlo.service.ItineraryService;
import com.ghoomlo.service.PackingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Port of backend/main.py api_plan() — full orchestration, same response shape.
@RestController
@RequestMapping("/api")
public class PlanController {
  private static final Logger log = LoggerFactory.getLogger(PlanController.class);
  private final SerpApiClient serp;
  private final BudgetService budget;
  private final ItineraryService itinerarySvc;
  private final InsightService insight;
  private final AirportResolver resolver;
  private final PackingService packing;
  private final Executor searchExec;

  public PlanController(SerpApiClient serp, BudgetService budget,
      ItineraryService itinerarySvc, InsightService insight, AirportResolver resolver,
      PackingService packing, @Qualifier("searchExecutor") Executor searchExec) {
    this.serp = serp;
    this.budget = budget;
    this.itinerarySvc = itinerarySvc;
    this.insight = insight;
    this.resolver = resolver;
    this.packing = packing;
    this.searchExec = searchExec;
  }

  /** Unwrap future failures so unresolvable-city 400s keep their shape
   *  instead of collapsing into a generic 502. */
  private static RuntimeException unwrapFuture(String what, Throwable e) {
    Throwable cause = e instanceof ExecutionException ee && ee.getCause() != null ? ee.getCause()
        : e instanceof CompletionException ce && ce.getCause() != null ? ce.getCause() : e;
    if (cause instanceof IllegalArgumentException iae) return iae;
    if (cause instanceof RuntimeException re) return re;
    return new RuntimeException(what + " failed: " + cause);
  }

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
    if (low.contains("failed to resolve") || low.contains("unknownhost") || low.contains("dns")
        || low.contains("network is unreachable") || low.contains("no route to host"))
      return "Couldn't reach SerpApi from this server (DNS/network blocked) — check internet, firewall or VPN and retry, or use 'Try demo trip' which works offline.";
    return "Search temporarily failed. Please try again in a moment.";
  }

  private String hotelTier(int pricePerNight, int lo, int span) {
    if (span <= 0) return "Budget";
    double pos = (pricePerNight - lo) * 1.0 / span;
    if (pos <= 1.0 / 3) return "Budget";
    if (pos <= 2.0 / 3) return "Mid-range";
    return "Higher-end";
  }

  private int intOf(Object v, int def) {
    if (v instanceof Number n) return n.intValue();
    try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return def; }
  }

  // Generous upper bound: prevents absurd date ranges from exploding
  // hotel math and itinerary sizing before any paid call runs.
  private static final int MAX_TRIP_NIGHTS = 90;

  @PostMapping("/plan")
  public ResponseEntity<?> plan(@Valid @RequestBody PlanReq req) {
    // Rate limiting runs at the edge (RateLimitFilter, before validation),
    // so it covers invalid payloads and force_refresh floods too.
    try {
      int travelers = Math.min(20, Math.max(1, req.travelers()));
      int nights = numNights(req.departure_date(), req.return_date());
      if (nights > MAX_TRIP_NIGHTS) {
        return ResponseEntity.status(422).body(Map.of("error",
            "Trip length must be " + MAX_TRIP_NIGHTS + " nights or fewer — try a shorter date range."));
      }
      // Past departures can never return live bookable prices — reject before
      // spending any SerpApi quota (frontend also constrains + validates).
      try {
        if (LocalDate.parse(req.departure_date()).isBefore(LocalDate.now())) {
          return ResponseEntity.status(422).body(Map.of("error",
              "Departure date is in the past — pick today or a future date."));
        }
      } catch (Exception ignored) { /* format errors belong to DTO @Pattern */ }
      boolean fr = req.force_refresh();
      // Flights resolve aliases and airport codes. Use the same resolved city
      // for all destination searches so the trip cannot mix locations.
      String destinationSearch = resolver.canonicalSearchLocation(req.destination());

      // STAGE 1 — flights + hotels run CONCURRENTLY on the search pool.
      // Sequential core was the dominant latency: 2 x (3 attempts x 20s)
      // worst case back-to-back. Wall time is now the slower of the two.
      CompletableFuture<Map<String, Object>> flightF = CompletableFuture.supplyAsync(
          () -> serp.fetchFlightsRaw(req.origin(), req.destination(),
              req.departure_date(), req.return_date(), travelers, fr),
          searchExec);
      CompletableFuture<Map<String, Object>> hotelF = CompletableFuture.supplyAsync(
          () -> serp.fetchHotelsRaw(destinationSearch, req.departure_date(),
              req.return_date(), travelers, fr),
          searchExec);
      Map<String, Object> rawF;
      Map<String, Object> rawH;
      try {
        CompletableFuture.allOf(flightF, hotelF).get(60, TimeUnit.SECONDS);
        rawF = flightF.getNow(null);
        rawH = hotelF.getNow(null);
      } catch (TimeoutException te) {
        flightF.cancel(true);
        hotelF.cancel(true);
        log.warn("core flight+hotel fan-out timed out");
        return ResponseEntity.status(502).body(Map.of("error", "Search temporarily failed. Please try again in a moment."));
      } catch (Exception e) {
        throw unwrapFuture("flight/hotel search", e);
      }
      List<Map<String, Object>> flights = serp.parseFlights(rawF, travelers);
      if (flights.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("error", "No flights found. Try different airports or dates."));
      }

      List<Map<String, Object>> hotels = serp.parseHotels(rawH, nights);
      if (hotels.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("error", "No hotels found. Try a broader destination name."));
      }

      List<Integer> prices = new ArrayList<>();
      for (Map<String, Object> h : hotels) {
        if (h.get("price_per_night") instanceof Number) prices.add(((Number) h.get("price_per_night")).intValue());
      }
      int loPrice = prices.stream().min(Integer::compare).orElse(0);
      int hiPrice = prices.stream().max(Integer::compare).orElse(0);
      int span = hiPrice - loPrice;
      List<Map<String, Object>> hotelOptions = new ArrayList<>();
      for (Map<String, Object> h : hotels.subList(0, Math.min(5, hotels.size()))) {
        Map<String, Object> o = new LinkedHashMap<>();
        o.put("name", h.get("name"));
        o.put("rating", h.get("rating"));
        o.put("price_per_night", h.get("price_per_night"));
        o.put("total_price", h.get("total_price"));
        o.put("image", h.get("image"));
        o.put("lat", h.get("lat"));
        o.put("lng", h.get("lng"));
        // Pass through lazy-reviews key (omitted when SerpApi gave none).
        if (h.get("property_token") != null) o.put("property_token", h.get("property_token"));
        if (h.get("reviews_count") != null) o.put("reviews_count", h.get("reviews_count"));
        o.put("tier", hotelTier(intOf(h.get("price_per_night"), loPrice), loPrice, span));
        hotelOptions.add(o);
      }

      String mode = req.travel_mode();
      if (!"saver".equals(mode) && !"balanced".equals(mode) && !"comfort".equals(mode)) mode = "balanced";
      List<Map<String, Object>> alternativeHotels = hotels;
      Map<String, Object> match;

      if (req.selected_hotel_name() != null && !req.selected_hotel_name().isBlank()) {
        Map<String, Object> chosen = null;
        for (Map<String, Object> h : hotels) {
          if (req.selected_hotel_name().equals(String.valueOf(h.get("name")))) { chosen = h; break; }
        }
        if (chosen == null) {
          return ResponseEntity.status(400).body(Map.of("error",
              "Unknown hotel \u2018" + req.selected_hotel_name() + "\u2019 for this trip — pick one from hotel_options."));
        }
        List<Map<String, Object>> ranked = budget.rankCombinations(flights, List.of(chosen), req.budget(), mode);
        if (!ranked.isEmpty()) {
          Map<String, Object> selected = ranked.get(0);
          boolean fits = intOf(selected.get("total_cost"), Integer.MAX_VALUE) <= req.budget();
          Map<String, Object> bestPick = selected;
          if (!fits) {
            bestPick = new LinkedHashMap<>(selected);
            bestPick.put("over_by", intOf(selected.get("total_cost"), 0) - req.budget());
          }
          match = new LinkedHashMap<>();
          match.put("fits_budget", fits);
          match.put("best_pick", bestPick);
          match.put("candidates", ranked);
          // Honest overspend: negative remaining means over budget (canonical).
          match.put("remaining_budget", req.budget() - intOf(selected.get("total_cost"), req.budget()));
        } else {
          match = budget.findBestCombination(flights, List.of(chosen), req.budget());
        }
        alternativeHotels = List.of(chosen);
      } else {
        List<Map<String, Object>> ranked = budget.rankCombinations(flights, hotels, req.budget(), mode);
        match = budget.findBestCombination(flights, hotels, req.budget());
        if (!ranked.isEmpty()) {
          Map<String, Object> selected = ranked.get(0);
          boolean fits = intOf(selected.get("total_cost"), Integer.MAX_VALUE) <= req.budget();
          Map<String, Object> bestPick = selected;
          if (!fits) {
            bestPick = new LinkedHashMap<>(selected);
            bestPick.put("over_by", intOf(selected.get("total_cost"), 0) - req.budget());
          }
          Map<String, Object> m2 = new LinkedHashMap<>();
          m2.put("fits_budget", fits);
          m2.put("best_pick", bestPick);
          m2.put("candidates", ranked);
          // Honest overspend: negative remaining means over budget (canonical).
          m2.put("remaining_budget", req.budget() - intOf(selected.get("total_cost"), req.budget()));
          match = m2;
        }
      }

      @SuppressWarnings("unchecked")
      Map<String, Object> best = (Map<String, Object>) match.get("best_pick");
      @SuppressWarnings("unchecked")
      Map<String, Object> bestHotel = (Map<String, Object>) best.get("hotel");
      String hotelName = String.valueOf(bestHotel.get("name"));
      String anchor = hotelName + ", " + destinationSearch;
      Double hotelLat = bestHotel.get("lat") instanceof Number ? ((Number) bestHotel.get("lat")).doubleValue() : null;
      Double hotelLng = bestHotel.get("lng") instanceof Number ? ((Number) bestHotel.get("lng")).doubleValue() : null;

      // STAGE 2 — attractions + restaurants run CONCURRENTLY. Same wall-time
      // logic: the slower of the two, not the sum. Each isolated: failure
      // only empties its own list, never the trip.
      CompletableFuture<Map<String, Object>> attrF = CompletableFuture.supplyAsync(
          () -> serp.fetchPlacesRaw(anchor, "attractions", fr), searchExec);
      CompletableFuture<Map<String, Object>> restF = CompletableFuture.supplyAsync(
          () -> serp.fetchPlacesRaw(anchor, "restaurants", fr), searchExec);
      Map<String, Object> rawA = Map.of();
      Map<String, Object> rawR = Map.of();
      List<Map<String, Object>> attractions = new ArrayList<>();
      List<Map<String, Object>> restaurants = new ArrayList<>();
      try {
        CompletableFuture.allOf(attrF, restF).get(45, TimeUnit.SECONDS);
      } catch (Exception e) {
        log.warn("places fan-out timed out/failed — using partial results: {}", e.toString());
      }
      try {
        Map<String, Object> r = attrF.getNow(null);
        if (r != null) {
          rawA = r;
          attractions = serp.parsePlaces(rawA, "attractions");
        }
      } catch (Exception e) {
        log.warn("attractions lookup failed: {}", e.toString());
      }
      try {
        Map<String, Object> r = restF.getNow(null);
        if (r != null) {
          rawR = r;
          restaurants = serp.parsePlaces(rawR, "restaurants");
        }
      } catch (Exception e) {
        log.warn("restaurants lookup failed: {}", e.toString());
      }

      List<Map<String, Object>> itinerary = itinerarySvc.buildItinerary(attractions, restaurants, nights, hotelLat, hotelLng);
      boolean anyLive = false;
      for (Map<String, Object> r : List.of(rawF, rawH, rawA, rawR)) {
        if (r != null && !r.isEmpty() && !Boolean.TRUE.equals(r.get("_from_cache"))) { anyLive = true; break; }
      }
      // if all empty maps, fall back to raw flags
      if (rawA.isEmpty() && rawR.isEmpty()) {
        anyLive = !Boolean.TRUE.equals(rawF.get("_from_cache")) || !Boolean.TRUE.equals(rawH.get("_from_cache"));
      }
      // Stale fallback (outage snapshot) is tracked separately: it must
      // never be presented as live prices downstream.
      boolean anyStale = false;
      for (Map<String, Object> r : List.of(rawF, rawH, rawA, rawR)) {
        if (r != null && Boolean.TRUE.equals(r.get("_stale"))) { anyStale = true; break; }
      }

      // Optional enrichments run CONCURRENTLY (each isolated — failure only
      // omits its field, never a 502). Sequential + retried optionals were
      // the long-tail bottleneck: 5 x (3 attempts x 20s) worst case.
      // Single-attempt fetchers (see SerpApiClient) + parallel fan-out make
      // the wall time the slowest single enrichment instead of the sum.
      CompletableFuture<Map<String, Object>> weatherF =
          CompletableFuture.supplyAsync(() -> {
              try { return serp.fetchWeatherSnapshot(destinationSearch, fr); }
            catch (Exception e) { log.warn("weather snapshot failed (omitted): {}", e.toString()); return null; }
          }, searchExec);
      CompletableFuture<List<Map<String, Object>>> eventsF =
          CompletableFuture.supplyAsync(() -> {
            try {
              Map<String, Object> rawEv = serp.fetchEventsRaw(destinationSearch, req.departure_date(), req.return_date(), fr);
              return serp.parseEvents(rawEv, req.departure_date(), req.return_date());
            } catch (Exception e) { log.warn("events lookup failed (omitted): {}", e.toString()); return new ArrayList<>(); }
          }, searchExec);
      CompletableFuture<Map<String, Object>> exchangeF =
          CompletableFuture.supplyAsync(() -> {
            try {
              String originCountry = resolver.countryForCity(req.origin());
              String destCountry = resolver.countryForCity(req.destination());
              if (originCountry != null && destCountry != null && !originCountry.equals(destCountry)) {
                String fromCur = SerpApiClient.COUNTRY_CURRENCY.get(originCountry);
                String toCur = SerpApiClient.COUNTRY_CURRENCY.get(destCountry);
                if (fromCur != null && toCur != null && !fromCur.equals(toCur)) {
                  return serp.fetchExchangeRate(fromCur, toCur, fr);
                }
              }
              return null;
            } catch (Exception e) { log.warn("exchange rate lookup failed (omitted): {}", e.toString()); return null; }
          }, searchExec);
      CompletableFuture<List<Map<String, Object>>> knowF =
          CompletableFuture.supplyAsync(() -> {
            try {
              Map<String, Object> rawKnow = serp.fetchKnowRaw(destinationSearch, fr);
              if (rawKnow != null) return serp.parseKnow(rawKnow, 5);
              return new ArrayList<>();
            } catch (Exception e) { log.warn("know lookup failed (omitted): {}", e.toString()); return new ArrayList<>(); }
          }, searchExec);
      CompletableFuture<List<Map<String, Object>>> videosF =
          CompletableFuture.supplyAsync(() -> {
            try {
              Map<String, Object> rawVid = serp.fetchVideosRaw(destinationSearch, fr);
              if (rawVid != null) return serp.parseVideos(rawVid, 3);
              return new ArrayList<>();
            } catch (Exception e) { log.warn("videos lookup failed (omitted): {}", e.toString()); return new ArrayList<>(); }
          }, searchExec);
      // Bounded fan-out: one hung enrichment must not stall the trip.
      // Optionals already fail fast at 8s each (see SerpApiClient), so 15s
      // covers the whole set running concurrently. On timeout the completed
      // futures keep their values, the rest fall back to omitted/empty.
      try {
        CompletableFuture.allOf(weatherF, eventsF, exchangeF, knowF, videosF).get(15, TimeUnit.SECONDS);
      } catch (TimeoutException te) {
        log.warn("enrichment fan-out timed out after 15s — using partial results");
        for (CompletableFuture<?> f : List.of(weatherF, eventsF, exchangeF, knowF, videosF)) f.cancel(true);
      } catch (Exception e) {
        log.warn("enrichment fan-out failed (omitted): {}", e.toString());
      }
      Map<String, Object> weather = weatherF.getNow(null);
      List<Map<String, Object>> events = eventsF.getNow(new ArrayList<>());
      Map<String, Object> exchangeRate = exchangeF.getNow(null);
      List<Map<String, Object>> know = knowF.getNow(new ArrayList<>());
      List<Map<String, Object>> videos = videosF.getNow(new ArrayList<>());

      @SuppressWarnings("unchecked")
      List<Map<String, Object>> candidates = (List<Map<String, Object>>) match.getOrDefault("candidates", List.of());
      Map<String, Object> resp = new LinkedHashMap<>();
      resp.put("origin", req.origin());
      resp.put("destination", req.destination());
      resp.put("departure_date", req.departure_date());
      resp.put("return_date", req.return_date());
      resp.put("travelers", travelers);
      resp.put("budget", req.budget());
      resp.put("num_nights", nights);
      resp.put("fits_budget", match.get("fits_budget"));
      resp.put("best_pick", best);
      resp.put("remaining_budget", match.get("remaining_budget"));
      resp.put("other_options", candidates.size() > 1 ? candidates.subList(1, Math.min(5, candidates.size())) : List.of());
      resp.put("hotel_options", hotelOptions);
      resp.put("selected_hotel_name", req.selected_hotel_name());
      resp.put("travel_mode", mode);
      resp.put("plan_alternatives", budget.buildModeAlternatives(flights, alternativeHotels, req.budget()));
      resp.put("itinerary", itinerary);
      List<Map<String, Object>> places = new ArrayList<>(attractions);
      places.addAll(restaurants);
      resp.put("places", places);
      resp.put("events", events);
      Map<String, Object> counts = new LinkedHashMap<>();
      counts.put("flights", flights.size());
      counts.put("hotels", hotels.size());
      counts.put("attractions", attractions.size());
      counts.put("restaurants", restaurants.size());
      resp.put("counts", counts);
      resp.put("live_search", anyLive && !anyStale);
      if (anyStale) resp.put("stale", true);
      if (weather != null) resp.put("weather", weather);
      try {
        // Zero-search rule engine on the live snapshot above (or a
        // nights-scaled basics fallback when weather is unavailable).
        resp.put("packing", packing.buildPacking(weather, nights, travelers));
      } catch (Exception e) {
        log.warn("packing build failed (omitted): {}", e.toString());
      }
      if (exchangeRate != null) resp.put("exchange_rate", exchangeRate);
      if (!know.isEmpty()) resp.put("know", know);
      if (!videos.isEmpty()) resp.put("videos", videos);
      boolean fits = Boolean.TRUE.equals(match.get("fits_budget"));
      if (!fits && best != null) {
        @SuppressWarnings("unchecked")
        Map<String, Object> bf = (Map<String, Object>) best.get("flight");
        @SuppressWarnings("unchecked")
        Map<String, Object> bh = (Map<String, Object>) best.get("hotel");
        int overBy = intOf(best.get("over_by"), 0);
        resp.put("suggestions", budget.generateSavingsSuggestions(flights, hotels, bf, bh, overBy, nights));
      }
      try {
        resp.put("insight", insight.generateTripInsight(best,
            intOf(match.get("remaining_budget"), 0), req.budget(), itinerary, fits));
      } catch (Exception e) {
        log.warn("insight generation failed (omitted): {}", e.toString());
      }
      return ResponseEntity.ok(resp);
    } catch (IllegalArgumentException e) {
      String msg = String.valueOf(e.getMessage());
      if (msg.startsWith("unresolvable ")) {
        String bad = msg.contains(": ") ? msg.split(": ", 2)[1] : "that city";
        String field = msg.startsWith("unresolvable origin") ? "origin" : "destination";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error",
            "Couldn\u2019t find an airport for \u2018" + bad + "\u2019 — try the 3-letter airport code instead (e.g. DEL, LHR, JFK)");
        body.put("field", field);
        body.put("value", bad);
        body.put("suggestions", resolver.suggestAirports(bad, 3));
        return ResponseEntity.status(400).body(body);
      }
      log.error("plan failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    } catch (Exception e) {
      log.error("plan failed", e);
      return ResponseEntity.status(502).body(Map.of("error", friendlyError(e)));
    }
  }
}
