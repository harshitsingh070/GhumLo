package com.ghoomlo.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ghoomlo.service.AirportResolver;
import com.ghoomlo.service.FileCacheService;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

// Port of backend/serpapi_client.py — fetchers + defensive parsers + backoff.
// No official Java SDK: plain WebClient GET /search.json.
@Component
public class SerpApiClient {
  private static final Logger log = LoggerFactory.getLogger(SerpApiClient.class);
  public static final long TTL_WEATHER = 6 * 3600L;
  public static final long TTL_EXCHANGE = 12 * 3600L;
  public static final long TTL_REVIEWS = 24 * 3600L;
  private static final long BACKOFF_SECONDS = 6 * 3600L;

  private final WebClient serpApiWebClient;
  private final FileCacheService cache;
  private final AirportResolver airports;
  private final ObjectMapper mapper = new ObjectMapper();
  private final ConcurrentHashMap<String, Long> failUntil = new ConcurrentHashMap<>();

  @Value("${serpapi.api-key:}")
  private String apiKeyProp;

  @Value("${serpapi.timeout-seconds:20}")
  private int timeoutProp;

  public SerpApiClient(@Qualifier("serpApiWebClient") WebClient serpApiWebClient, FileCacheService cache, AirportResolver airports) {
    this.serpApiWebClient = serpApiWebClient;
    this.cache = cache;
    this.airports = airports;
  }

  private String apiKey() {
    String env = System.getenv("SERPAPI_API_KEY");
    String key = (env != null && !env.isBlank()) ? env : (apiKeyProp == null ? "" : apiKeyProp.strip());
    if (key.isEmpty() || key.equals("your_key_here")) {
      throw new IllegalArgumentException("SERPAPI_API_KEY is missing. Copy .env.example to .env and add your key.");
    }
    return key;
  }

  private int timeoutSeconds() {
    String env = System.getenv("SERPAPI_TIMEOUT_SECONDS");
    int t = timeoutProp;
    try { if (env != null) t = Integer.parseInt(env.strip()); } catch (Exception ignored) {}
    return Math.max(5, t);
  }

  private String optKey(String cacheName, Map<String, Object> params) {
    try {
      return cacheName + ":" + mapper.writeValueAsString(new java.util.TreeMap<>(params));
    } catch (Exception e) { return cacheName + ":" + params.toString(); }
  }

  private boolean optInBackoff(String cacheName, Map<String, Object> params) {
    Long until = failUntil.get(optKey(cacheName, params));
    return until != null && System.currentTimeMillis() < until;
  }

  private void optMarkFailed(String cacheName, Map<String, Object> params) {
    failUntil.put(optKey(cacheName, params), System.currentTimeMillis() + BACKOFF_SECONDS * 1000L);
  }

  private void optMarkOk(String cacheName, Map<String, Object> params) {
    failUntil.remove(optKey(cacheName, params));
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> search(Map<String, Object> params, String cacheName,
      boolean skipCache, Long ttlSeconds) {
    if (!skipCache) {
      Map<String, Object> cached = cache.get(cacheName, params, ttlSeconds);
      if (cached != null) {
        log.info("[cache HIT] {} params={}", cacheName, params);
        Map<String, Object> out = new LinkedHashMap<>(cached);
        out.put("_from_cache", true);
        return out;
      }
    } else {
      log.info("[force live] {} params={}", cacheName, params);
    }
    log.info("[live API] {} params={}", cacheName, params);
    Map<String, Object> withKey = new LinkedHashMap<>(params);
    withKey.put("api_key", apiKey());
    String json;
    try {
      json = serpApiWebClient.get().uri(uri -> {
        var b = uri.path("/search.json");
        withKey.forEach((k, v) -> b.queryParam(k, String.valueOf(v)));
        return b.build();
      }).retrieve().bodyToMono(String.class).block(Duration.ofSeconds(timeoutSeconds()));
    } catch (Exception e) {
      log.error("SerpApi {} failed: {}: {}", cacheName, e.getClass().getSimpleName(), e.getMessage());
      throw new RuntimeException(e);
    }
    Map<String, Object> results;
    try {
      results = mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
    } catch (Exception e) {
      throw new RuntimeException("Bad SerpApi response: " + e.getMessage());
    }
    if (results.containsKey("error")) {
      log.error("SerpApi {} error: {}", cacheName, results.get("error"));
      throw new RuntimeException(String.valueOf(results.get("error")));
    }
    cache.set(cacheName, params, results);
    results.put("_from_cache", false);
    return results;
  }

  // ---------- raw fetchers ----------
  public Map<String, Object> fetchFlightsRaw(String origin, String destination,
      String departureDate, String returnDate, int travelers, boolean forceRefresh) {
    String dep = airports.resolveCityToAirport(origin == null ? "" : origin);
    String arr = airports.resolveCityToAirport(destination == null ? "" : destination);
    if (dep == null) throw new IllegalArgumentException("unresolvable origin: " + String.valueOf(origin).strip());
    if (arr == null) throw new IllegalArgumentException("unresolvable destination: " + String.valueOf(destination).strip());
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_flights");
    params.put("departure_id", dep);
    params.put("arrival_id", arr);
    params.put("outbound_date", departureDate);
    params.put("currency", "INR");
    params.put("hl", "en");
    if (returnDate != null && !returnDate.isBlank()) params.put("return_date", returnDate);
    return search(params, "flights", forceRefresh, null);
  }

  public Map<String, Object> fetchHotelsRaw(String destination, String checkIn,
      String checkOut, int travelers, boolean forceRefresh) {
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_hotels");
    params.put("q", destination);
    params.put("check_in_date", checkIn);
    params.put("check_out_date", checkOut);
    params.put("adults", travelers);
    params.put("currency", "INR");
    params.put("hl", "en");
    return search(params, "hotels", forceRefresh, null);
  }

  public Map<String, Object> fetchPlacesRaw(String location, String category, boolean forceRefresh) {
    String loc = location == null ? "" : location;
    String query = loc.toLowerCase().contains(category.toLowerCase()) ? loc : category + " near " + loc;
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_maps");
    params.put("q", query);
    params.put("type", "search");
    params.put("hl", "en");
    return search(params, "places_" + category, forceRefresh, null);
  }

  // ---------- shared parser helpers ----------
  public static Integer toInrNumber(Object value) {
    if (value == null) return null;
    if (value instanceof Number n) return n.intValue();
    String s = String.valueOf(value).replace("\u20B9", "").replace("$", "").replace(",", "").strip();
    StringBuilder digits = new StringBuilder();
    for (char c : s.toCharArray()) if (Character.isDigit(c)) digits.append(c);
    if (digits.length() == 0) return null;
    try { return Integer.parseInt(digits.toString()); } catch (Exception e) { return null; }
  }

  @SuppressWarnings("unchecked")
  private static double[] latLng(Map<String, Object> item) {
    try {
      Object gps = item.get("gps_coordinates");
      if (!(gps instanceof Map)) return new double[]{Double.NaN, Double.NaN};
      Object la = ((Map<String, Object>) gps).get("latitude");
      Object ln = ((Map<String, Object>) gps).get("longitude");
      if (la == null || ln == null) return new double[]{Double.NaN, Double.NaN};
      return new double[]{Double.parseDouble(String.valueOf(la)), Double.parseDouble(String.valueOf(ln))};
    } catch (Exception e) { return new double[]{Double.NaN, Double.NaN}; }
  }

  @SuppressWarnings("unchecked")
  private static String imageUrl(Object value) {
    if (value instanceof String s && (s.startsWith("http://") || s.startsWith("https://"))) return s.strip();
    if (value instanceof Map m) {
      for (String k : List.of("thumbnail", "image", "original", "link", "url")) {
        String f = imageUrl(m.get(k));
        if (f != null) return f;
      }
    }
    return null;
  }

  // ---------- flight / hotel / place parsers ----------
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseFlights(Map<String, Object> raw, int travelers) {
    List<Map<String, Object>> out = new ArrayList<>();
    List<Map<String, Object>> groups = new ArrayList<>();
    if (raw.get("best_flights") instanceof List) groups.addAll((List<Map<String, Object>>) raw.get("best_flights"));
    if (raw.get("other_flights") instanceof List) groups.addAll((List<Map<String, Object>>) raw.get("other_flights"));
    if (groups.isEmpty() && raw.get("flights_results") instanceof List) {
      groups.addAll((List<Map<String, Object>>) raw.get("flights_results"));
    }
    int mult = Math.max(1, travelers);
    for (Map<String, Object> g : groups.subList(0, Math.min(15, groups.size()))) {
      try {
        List<Map<String, Object>> legs = List.of();
        if (g.get("flights") instanceof List) legs = (List<Map<String, Object>>) g.get("flights");
        Map<String, Object> first = legs.isEmpty() ? g : legs.get(0);
        String airline = null;
        if (first.get("airline") != null) airline = String.valueOf(first.get("airline"));
        else if (g.get("airline") != null) airline = String.valueOf(g.get("airline"));
        else {
          StringBuilder sb = new StringBuilder();
          for (Map<String, Object> l : legs) {
            if (l.get("airline") != null) {
              if (sb.length() > 0) sb.append(", ");
              sb.append(l.get("airline"));
            }
          }
          airline = sb.length() == 0 ? "Unknown airline" : sb.toString();
        }
        Object priceRaw = g.get("price") != null ? g.get("price")
            : (g.get("total_price") != null ? g.get("total_price") : first.get("price"));
        Integer price = toInrNumber(priceRaw);
        if (price == null) continue;
        Object dur = g.get("total_duration") != null ? g.get("total_duration") : first.get("duration");
        String duration;
        if (dur instanceof Number) {
          int mins = ((Number) dur).intValue();
          duration = (mins / 60) + "h " + (mins % 60) + "m";
        } else duration = dur == null ? "\u2014" : String.valueOf(dur);
        Object stopsObj = g.get("layovers") != null ? g.get("layovers") : first.get("layovers");
        int nStops;
        if (stopsObj instanceof List) nStops = ((List<?>) stopsObj).size();
        else if (stopsObj instanceof Number) nStops = ((Number) stopsObj).intValue();
        else nStops = legs.size() > 1 ? legs.size() - 1 : 0;
        Map<String, Object> flight = new LinkedHashMap<>();
        flight.put("airline", airline);
        flight.put("price", price * mult);
        flight.put("price_per_person", price);
        flight.put("duration", duration);
        flight.put("stops", nStops);
        Object dep = first.get("departure_airport");
        Object arr2 = first.get("arrival_airport");
        flight.put("departure", dep instanceof Map ? dep : Map.of());
        flight.put("arrival", arr2 instanceof Map ? arr2 : Map.of());
        String img = imageUrl(first.get("airline_logo"));
        if (img == null) img = imageUrl(first.get("logo"));
        if (img == null) img = imageUrl(g.get("airline_logo"));
        if (img == null) img = imageUrl(g.get("logo"));
        if (img != null) flight.put("image", img);
        out.add(flight);
      } catch (Exception e) {
        log.warn("skip malformed flight entry: {}", e.toString());
      }
    }
    out.sort(Comparator.comparingInt(m -> ((Number) m.get("price")).intValue()));
    return out;
  }

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseHotels(Map<String, Object> raw, int numNights) {
    List<Map<String, Object>> out = new ArrayList<>();
    Object propsObj = raw.get("properties") != null ? raw.get("properties") : raw.get("hotels_results");
    if (!(propsObj instanceof List)) return out;
    List<Map<String, Object>> props = (List<Map<String, Object>>) propsObj;
    for (Map<String, Object> h : props.subList(0, Math.min(15, props.size()))) {
      try {
        String name = h.get("name") == null ? "Unnamed hotel" : String.valueOf(h.get("name"));
        Object ratingRaw = h.get("overall_rating") != null ? h.get("overall_rating")
            : (h.get("rating") != null ? h.get("rating") : h.get("stars"));
        Double rating = null;
        if (ratingRaw != null) {
          try { rating = Double.parseDouble(String.valueOf(ratingRaw).split(" ")[0]); }
          catch (Exception ignored) {}
        }
        Object nightlyRaw = null, totalRaw = null;
        Object rpn = h.get("rate_per_night");
        if (rpn instanceof Map m) {
          nightlyRaw = m.get("lowest") != null ? m.get("lowest") : m.get("extracted_lowest");
        }
        if (nightlyRaw == null) nightlyRaw = h.get("price") != null ? h.get("price") : h.get("extracted_price");
        Object tr = h.get("total_rate");
        if (tr instanceof Map m) totalRaw = m.get("lowest") != null ? m.get("lowest") : m.get("extracted_lowest");
        Integer nightly = toInrNumber(nightlyRaw);
        Integer total = toInrNumber(totalRaw);
        if (nightly == null && total != null && numNights > 0) nightly = (int) Math.round(total * 1.0 / numNights);
        if (total == null && nightly != null) total = nightly * numNights;
        if (nightly == null) continue;
        double[] ll = latLng(h);
        Map<String, Object> hotel = new LinkedHashMap<>();
        hotel.put("name", name);
        hotel.put("rating", rating);
        hotel.put("price_per_night", nightly);
        hotel.put("total_price", total);
        // Lazy-reviews key: propagated so the frontend can call
        // POST /api/hotels/reviews on expand (1 search, cached 24h).
        // Never fetched inside /api/plan — quota-safe by design.
        Object propertyToken = h.get("property_token");
        if (propertyToken != null && !String.valueOf(propertyToken).isBlank()) {
          hotel.put("property_token", String.valueOf(propertyToken).strip());
        }
        Object reviewsCount = h.get("reviews");
        if (reviewsCount instanceof Number n) {
          hotel.put("reviews_count", n.intValue());
        }
        Object am = h.get("amenities");
        hotel.put("amenities", am instanceof List ? ((List<?>) am).subList(0, Math.min(6, ((List<?>) am).size())) : List.of());
        hotel.put("lat", Double.isNaN(ll[0]) ? null : ll[0]);
        hotel.put("lng", Double.isNaN(ll[1]) ? null : ll[1]);
        String image = imageUrl(h.get("thumbnail"));
        if (image == null) image = imageUrl(h.get("image"));
        if (image == null) {
          Object imgs = h.get("images") != null ? h.get("images") : h.get("photos");
          if (imgs instanceof List) {
            for (Object it : (List<?>) imgs) {
              String u = null;
              if (it instanceof String s && (s.startsWith("http://") || s.startsWith("https://"))) u = s;
              else u = imageUrl(it);
              if (u != null) { image = u; break; }
            }
          }
        }
        if (image != null) hotel.put("image", image);
        out.add(hotel);
      } catch (Exception e) {
        log.warn("skip malformed hotel entry: {}", e.toString());
      }
    }
    out.sort(Comparator.comparingInt(m -> ((Number) m.get("total_price")).intValue()));
    return out;
  }

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parsePlaces(Map<String, Object> raw, String category) {
    List<Map<String, Object>> out = new ArrayList<>();
    Object resObj = raw.get("local_results") != null ? raw.get("local_results") : raw.get("place_results");
    if (!(resObj instanceof List)) return out;
    List<Map<String, Object>> results = (List<Map<String, Object>>) resObj;
    for (Map<String, Object> p : results.subList(0, Math.min(20, results.size()))) {
      try {
        Object nameObj = p.get("title") != null ? p.get("title") : p.get("name");
        if (nameObj == null) continue;
        Object ratingRaw = p.get("rating");
        Double rating = null;
        if (ratingRaw != null) {
          try { rating = Double.parseDouble(String.valueOf(ratingRaw)); } catch (Exception ignored) {}
        }
        double[] ll = latLng(p);
        Object image = p.get("thumbnail") != null ? p.get("thumbnail") : p.get("image");
        Object photos = p.get("images") != null ? p.get("images") : p.get("photos");
        if (image == null && photos instanceof List && !((List<?>) photos).isEmpty()) {
          Object first = ((List<?>) photos).get(0);
          if (first instanceof String s) image = s;
          else if (first instanceof Map m) image = m.get("thumbnail") != null ? m.get("thumbnail") : m.get("image");
        }
        Map<String, Object> place = new LinkedHashMap<>();
        place.put("name", String.valueOf(nameObj));
        place.put("rating", rating);
        place.put("category", category);
        // Lazy-reviews keys: propagated so the frontend can call
        // POST /api/places/reviews on expand (1 search, cached 24h).
        // Never fetched inside /api/plan — quota-safe by design.
        if (p.get("place_id") != null && !String.valueOf(p.get("place_id")).isBlank()) {
          place.put("place_id", String.valueOf(p.get("place_id")).strip());
        }
        if (p.get("data_id") != null && !String.valueOf(p.get("data_id")).isBlank()) {
          place.put("data_id", String.valueOf(p.get("data_id")).strip());
        }
        if (p.get("reviews") instanceof Number rn) {
          place.put("reviews_count", rn.intValue());
        }
        Object addr = p.get("address") != null ? p.get("address") : p.get("description");
        place.put("address", addr == null ? "" : String.valueOf(addr));
        place.put("lat", Double.isNaN(ll[0]) ? null : ll[0]);
        place.put("lng", Double.isNaN(ll[1]) ? null : ll[1]);
        if (image instanceof String s && !s.isBlank()) place.put("image", s.strip());
        out.add(place);
      } catch (Exception e) {
        log.warn("skip malformed place entry: {}", e.toString());
      }
    }
    return out;
  }

  // ---------- weather ----------
  @SuppressWarnings("unchecked")
  public Map<String, Object> parseWeather(Map<String, Object> raw) {
    Object boxObj = raw.get("answer_box");
    if (!(boxObj instanceof Map)) return null;
    Map<String, Object> box = (Map<String, Object>) boxObj;
    Object type = box.get("type");
    if (type != null && !"weather_result".equals(String.valueOf(type))) return null;
    Object temp = box.get("temperature");
    Object cond = box.get("weather") != null ? box.get("weather") : box.get("condition");
    if (temp == null && cond == null) return null;
    Map<String, Object> out = new LinkedHashMap<>();
    if (temp != null) out.put("temperature", String.valueOf(temp));
    if (box.get("unit") != null) out.put("unit", String.valueOf(box.get("unit")));
    if (cond != null) out.put("condition", String.valueOf(cond));
    if (box.get("humidity") != null) out.put("humidity", String.valueOf(box.get("humidity")));
    if (box.get("wind") != null) out.put("wind", String.valueOf(box.get("wind")));
    if (box.get("precipitation") != null) out.put("precipitation", String.valueOf(box.get("precipitation")));
    if (box.get("location") != null) out.put("location", String.valueOf(box.get("location")));
    if (box.get("date") != null) out.put("observed", String.valueOf(box.get("date")));
    Object icon = box.get("thumbnail") != null ? box.get("thumbnail") : box.get("icon");
    if (icon != null) out.put("icon", String.valueOf(icon));
    return out;
  }

  public Map<String, Object> fetchWeatherSnapshot(String destination, boolean forceRefresh) {
    String dest = destination == null ? "" : destination.strip();
    if (dest.isEmpty()) return null;
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google");
    params.put("q", "weather in " + dest);
    params.put("hl", "en");
    params.put("gl", "in");
    if (optInBackoff("weather", params)) {
      log.info("[backoff] weather for {} — skipping live call", dest);
      return null;
    }
    try {
      Map<String, Object> raw = search(params, "weather", forceRefresh, TTL_WEATHER);
      optMarkOk("weather", params);
      Map<String, Object> snap = parseWeather(raw);
      if (snap == null) log.info("weather: no answer box for {} (omitted)", dest);
      return snap;
    } catch (Exception e) {
      optMarkFailed("weather", params);
      log.warn("weather snapshot failed (omitted): {}: {}", e.getClass().getSimpleName(), e.getMessage());
      return null;
    }
  }

  // ---------- events ----------
  private static final Pattern MD_RE = Pattern.compile("\\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+(\\d{1,2})\\b", Pattern.CASE_INSENSITIVE);
  private static final Pattern DM_RE = Pattern.compile("\\b(\\d{1,2})\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\b", Pattern.CASE_INSENSITIVE);
  private static final List<String> MONTHS = List.of("jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec");

  private int[] parseMonthDay(Object text) {
    if (text == null) return null;
    String s = String.valueOf(text);
    Matcher m = MD_RE.matcher(s);
    if (m.find()) return new int[]{MONTHS.indexOf(m.group(1).substring(0,3).toLowerCase()) + 1, Integer.parseInt(m.group(2))};
    m = DM_RE.matcher(s);
    if (m.find()) return new int[]{MONTHS.indexOf(m.group(2).substring(0,3).toLowerCase()) + 1, Integer.parseInt(m.group(1))};
    return null;
  }

  private boolean inTripWindow(int[] md, String startIso, String endIso) {
    try {
      LocalDate s = LocalDate.parse(startIso);
      LocalDate e = LocalDate.parse(endIso);
      int[] lo = {s.getMonthValue(), s.getDayOfMonth()};
      int[] hi = {e.getMonthValue(), e.getDayOfMonth()};
      return (lo[0] < md[0] || (lo[0] == md[0] && lo[1] <= md[1]))
          && (md[0] < hi[0] || (md[0] == hi[0] && md[1] <= hi[1]));
    } catch (Exception ex) { return false; }
  }

  public Map<String, Object> fetchEventsRaw(String destination, String startDate,
      String endDate, boolean forceRefresh) {
    String dest = destination == null ? "" : destination.strip();
    if (dest.isEmpty()) throw new IllegalArgumentException("destination required for events");
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_events");
    params.put("q", "events in " + dest);
    params.put("hl", "en");
    params.put("gl", "in");
    if (optInBackoff("events", params)) throw new RuntimeException("events in failure backoff — skipping live call");
    try {
      Map<String, Object> raw = search(params, "events", forceRefresh, null);
      optMarkOk("events", params);
      return raw;
    } catch (Exception e) {
      optMarkFailed("events", params);
      throw new RuntimeException(e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseEvents(Map<String, Object> raw, String startDate, String endDate, int cap) {
    List<Map<String, Object>> out = new ArrayList<>();
    if (!(raw.get("events_results") instanceof List)) return out;
    boolean filterByDate = startDate != null && endDate != null;
    for (Object o : (List<?>) raw.get("events_results")) {
      if (out.size() >= cap) break;
      if (!(o instanceof Map)) continue;
      try {
        Map<String, Object> ev = (Map<String, Object>) o;
        Object title = ev.get("title");
        if (title == null) continue;
        Object dateObj = ev.get("date");
        Map<String, Object> dateInfo = dateObj instanceof Map ? (Map<String, Object>) dateObj : Map.of();
        int[] md = parseMonthDay(dateInfo.get("start_date"));
        if (md == null) md = parseMonthDay(dateInfo.get("when"));
        if (filterByDate) {
          if (md == null || !inTripWindow(md, startDate, endDate)) continue;
        }
        String venue = "";
        if (ev.get("venue") instanceof Map vm) {
          venue = vm.get("name") == null ? "" : String.valueOf(vm.get("name"));
        }
        if (venue.isEmpty()) {
          Object addr = ev.get("address");
          if (addr instanceof List) {
            StringBuilder sb = new StringBuilder();
            for (Object a : (List<?>) addr) {
              if (a != null && !String.valueOf(a).isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(a);
              }
            }
            venue = sb.toString();
          } else if (addr != null) venue = String.valueOf(addr);
        }
        String desc = ev.get("description") == null ? "" : String.valueOf(ev.get("description")).strip();
        if (desc.length() > 200) desc = desc.substring(0, 199).strip() + "\u2026";
        Object when = dateInfo.get("when") != null ? dateInfo.get("when") : dateInfo.get("start_date");
        Map<String, Object> e2 = new LinkedHashMap<>();
        e2.put("title", String.valueOf(title));
        e2.put("date", when == null ? "" : String.valueOf(when));
        e2.put("venue", venue);
        e2.put("description", desc);
        e2.put("link", ev.get("link") == null ? "" : String.valueOf(ev.get("link")));
        out.add(e2);
      } catch (Exception e) {
        log.warn("skip malformed event entry: {}", e.toString());
      }
    }
    return out;
  }

  public List<Map<String, Object>> parseEvents(Map<String, Object> raw, String startDate, String endDate) {
    return parseEvents(raw, startDate, endDate, 8);
  }

  // ---------- FX ----------
  public static final Map<String, String> COUNTRY_CURRENCY = Map.ofEntries(
      Map.entry("IN","INR"), Map.entry("GB","GBP"), Map.entry("US","USD"), Map.entry("AE","AED"),
      Map.entry("TH","THB"), Map.entry("SG","SGD"), Map.entry("MY","MYR"), Map.entry("ID","IDR"),
      Map.entry("VN","VND"), Map.entry("JP","JPY"), Map.entry("AU","AUD"), Map.entry("CA","CAD"),
      Map.entry("CH","CHF"), Map.entry("CN","CNY"), Map.entry("HK","HKD"), Map.entry("FR","EUR"),
      Map.entry("DE","EUR"), Map.entry("IT","EUR"), Map.entry("ES","EUR"), Map.entry("NL","EUR"),
      Map.entry("PT","EUR"), Map.entry("GR","EUR"), Map.entry("IE","EUR"), Map.entry("BE","EUR"),
      Map.entry("AT","EUR"), Map.entry("FI","EUR"), Map.entry("LU","EUR"), Map.entry("SK","EUR"),
      Map.entry("SI","EUR"), Map.entry("HR","EUR"), Map.entry("CY","EUR"), Map.entry("MT","EUR"),
      Map.entry("TR","TRY"), Map.entry("EG","EGP"), Map.entry("LK","LKR"), Map.entry("NP","NPR"),
      Map.entry("BD","BDT"), Map.entry("PK","PKR"), Map.entry("ZA","ZAR"), Map.entry("NZ","NZD"),
      Map.entry("KR","KRW"), Map.entry("RU","RUB"), Map.entry("MX","MXN"), Map.entry("BR","BRL"),
      Map.entry("SA","SAR"), Map.entry("QA","QAR"), Map.entry("OM","OMR"), Map.entry("KW","KWD"),
      Map.entry("BH","BHD"), Map.entry("JO","JOD"), Map.entry("MA","MAD"), Map.entry("KE","KES"),
      Map.entry("TZ","TZS"), Map.entry("UA","UAH"), Map.entry("PL","PLN"), Map.entry("CZ","CZK"),
      Map.entry("DK","DKK"), Map.entry("SE","SEK"), Map.entry("NO","NOK"), Map.entry("IS","ISK"),
      Map.entry("PH","PHP"), Map.entry("KH","KHR"), Map.entry("MM","MMK"), Map.entry("MN","MNT"),
      Map.entry("IL","ILS"), Map.entry("AR","ARS"), Map.entry("CL","CLP"), Map.entry("CO","COP"),
      Map.entry("PE","PEN"), Map.entry("GE","GEL"), Map.entry("AM","AMD"), Map.entry("AZ","AZN"),
      Map.entry("RS","RSD"), Map.entry("BG","BGN"), Map.entry("RO","RON"), Map.entry("HU","HUF"),
      Map.entry("NG","NGN"), Map.entry("GH","GHS"), Map.entry("ET","ETB"), Map.entry("DZ","DZD"),
      Map.entry("TN","TND"), Map.entry("UY","UYU"), Map.entry("PY","PYG"), Map.entry("BO","BOB")
  );

  @SuppressWarnings("unchecked")
  public Double parseExchangeRate(Map<String, Object> raw) {
    Object summary = raw.get("summary");
    if (summary instanceof Map sm) {
      for (String key : List.of("extracted_price", "price")) {
        try {
          Object val = sm.get(key);
          Double v = null;
          if (val instanceof String s) {
            Matcher m = Pattern.compile("\\d+(?:\\.\\d+)?").matcher(s.replace(",", ""));
            if (m.find()) v = Double.parseDouble(m.group());
          } else if (val != null) v = Double.parseDouble(String.valueOf(val));
          if (v != null && v > 0) return v;
        } catch (Exception ignored) {}
      }
    }
    Object graph = raw.get("graph");
    if (graph instanceof List g && !g.isEmpty()) {
      try {
        Object last = g.get(g.size() - 1);
        double v = last instanceof Map lm ? Double.parseDouble(String.valueOf(lm.get("price"))) : Double.parseDouble(String.valueOf(last));
        if (v > 0) return v;
      } catch (Exception ignored) {}
    }
    return null;
  }

  public Map<String, Object> fetchExchangeRate(String from, String to, boolean forceRefresh) {
    String fr = from == null ? "" : from.strip().toUpperCase();
    String t = to == null ? "" : to.strip().toUpperCase();
    if (fr.isEmpty() || t.isEmpty() || fr.equals(t)) return null;
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_finance");
    params.put("q", fr + "-" + t);
    params.put("hl", "en");
    if (optInBackoff("exchange_rate", params)) {
      log.info("[backoff] exchange rate {}-{} — skipping live call", fr, t);
      return null;
    }
    try {
      Map<String, Object> raw = search(params, "exchange_rate", forceRefresh, TTL_EXCHANGE);
      optMarkOk("exchange_rate", params);
      Double rate = parseExchangeRate(raw);
      if (rate == null) { log.info("exchange rate: no rate for {}-{} (omitted)", fr, t); return null; }
      Map<String, Object> out = new LinkedHashMap<>();
      out.put("rate", rate);
      out.put("from_currency", fr);
      out.put("to_currency", t);
      return out;
    } catch (Exception e) {
      optMarkFailed("exchange_rate", params);
      log.warn("exchange rate failed (omitted): {}: {}", e.getClass().getSimpleName(), e.getMessage());
      return null;
    }
  }

  // ---------- know / videos ----------
  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseKnow(Map<String, Object> raw, int cap) {
    List<Map<String, Object>> out = new ArrayList<>();
    if (!(raw.get("organic_results") instanceof List)) return out;
    for (Object o : (List<?>) raw.get("organic_results")) {
      if (out.size() >= cap) break;
      if (!(o instanceof Map)) continue;
      Map<String, Object> r = (Map<String, Object>) o;
      Object title = r.get("title");
      Object link = r.get("link");
      if (title == null || link == null || String.valueOf(title).isEmpty() || String.valueOf(link).isEmpty()) continue;
      String snippet = r.get("snippet") == null ? "" : String.valueOf(r.get("snippet")).strip();
      if (snippet.length() > 220) snippet = snippet.substring(0, 219).strip() + "\u2026";
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("title", String.valueOf(title));
      e.put("link", String.valueOf(link));
      e.put("snippet", snippet);
      out.add(e);
    }
    return out;
  }

  public Map<String, Object> fetchKnowRaw(String destination, boolean forceRefresh) {
    String dest = destination == null ? "" : destination.strip();
    if (dest.isEmpty()) return null;
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google");
    params.put("q", dest + " travel visa entry requirements best time to visit advisory");
    params.put("hl", "en");
    params.put("gl", "in");
    params.put("num", 10);
    if (optInBackoff("know", params)) {
      log.info("[backoff] know for {} — skipping live call", dest);
      return null;
    }
    try {
      Map<String, Object> raw = search(params, "know", forceRefresh, null);
      optMarkOk("know", params);
      return raw;
    } catch (Exception e) {
      optMarkFailed("know", params);
      log.warn("know lookup failed (omitted): {}: {}", e.getClass().getSimpleName(), e.getMessage());
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseVideos(Map<String, Object> raw, int cap) {
    List<Map<String, Object>> out = new ArrayList<>();
    if (!(raw.get("video_results") instanceof List)) return out;
    for (Object o : (List<?>) raw.get("video_results")) {
      if (out.size() >= cap) break;
      if (!(o instanceof Map)) continue;
      Map<String, Object> v = (Map<String, Object>) o;
      Object title = v.get("title");
      Object link = v.get("link");
      if (title == null || link == null || String.valueOf(title).isEmpty() || String.valueOf(link).isEmpty()) continue;
      Object thumb = v.get("thumbnail") != null ? v.get("thumbnail") : v.get("thumbnail_static");
      if (thumb instanceof Map tm) thumb = tm.get("static") != null ? tm.get("static") : tm.get("rich");
      Object channel = v.get("channel");
      String channelName = channel instanceof Map cm ? (cm.get("name") == null ? "" : String.valueOf(cm.get("name"))) : (channel == null ? "" : String.valueOf(channel));
      Map<String, Object> e = new LinkedHashMap<>();
      e.put("title", String.valueOf(title));
      e.put("link", String.valueOf(link));
      e.put("thumbnail", thumb == null ? "" : String.valueOf(thumb));
      e.put("channel", channelName);
      Object dur = v.get("duration") != null ? v.get("duration") : v.get("length");
      e.put("duration", dur == null ? "" : String.valueOf(dur));
      out.add(e);
    }
    return out;
  }

  public Map<String, Object> fetchVideosRaw(String destination, boolean forceRefresh) {
    String dest = destination == null ? "" : destination.strip();
    if (dest.isEmpty()) return null;
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "youtube");
    params.put("search_query", dest + " travel vlog itinerary guide");
    if (optInBackoff("videos", params)) {
      log.info("[backoff] videos for {} — skipping live call", dest);
      return null;
    }
    try {
      Map<String, Object> raw = search(params, "videos", forceRefresh, null);
      optMarkOk("videos", params);
      return raw;
    } catch (Exception e) {
      optMarkFailed("videos", params);
      log.warn("videos lookup failed (omitted): {}: {}", e.getClass().getSimpleName(), e.getMessage());
      return null;
    }
  }

  // ---------- lazy reviews (on-expand only, NEVER in /api/plan) ----------
  // Each call = exactly 1 SerpApi search. 24h file cache + 6h negative
  // backoff keep repeated expands quota-free.

  public Map<String, Object> fetchHotelReviewsRaw(String propertyToken, boolean forceRefresh) {
    String token = propertyToken == null ? "" : propertyToken.strip();
    if (token.isEmpty()) throw new IllegalArgumentException("property_token is required");
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_hotels_reviews");
    params.put("property_token", token);
    params.put("hl", "en");
    if (optInBackoff("hotel_reviews", params)) {
      throw new RuntimeException("hotel reviews in failure backoff — skipping live call");
    }
    try {
      Map<String, Object> raw = search(params, "hotel_reviews", forceRefresh, TTL_REVIEWS);
      optMarkOk("hotel_reviews", params);
      return raw;
    } catch (Exception e) {
      optMarkFailed("hotel_reviews", params);
      throw new RuntimeException(e.getMessage(), e);
    }
  }

  public Map<String, Object> fetchPlaceReviewsRaw(String placeId, String dataId, boolean forceRefresh) {
    String pid = placeId == null ? "" : placeId.strip();
    String did = dataId == null ? "" : dataId.strip();
    String resolved = !pid.isEmpty() ? pid : did;
    if (resolved.isEmpty()) throw new IllegalArgumentException("place_id (or data_id) is required");
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("engine", "google_maps_reviews");
    // SerpApi accepts the ChIJ place_id here; when only a data_id came back
    // from google_maps local_results we forward it as place_id — Google
    // resolves both forms for reviews.
    params.put("place_id", resolved);
    params.put("hl", "en");
    if (optInBackoff("place_reviews", params)) {
      throw new RuntimeException("place reviews in failure backoff — skipping live call");
    }
    try {
      Map<String, Object> raw = search(params, "place_reviews", forceRefresh, TTL_REVIEWS);
      optMarkOk("place_reviews", params);
      return raw;
    } catch (Exception e) {
      optMarkFailed("place_reviews", params);
      throw new RuntimeException(e.getMessage(), e);
    }
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> parseReviewList(Map<String, Object> raw, int cap) {
    List<Map<String, Object>> out = new ArrayList<>();
    if (raw == null || !(raw.get("reviews") instanceof List)) return out;
    for (Object o : (List<?>) raw.get("reviews")) {
      if (out.size() >= cap) break;
      if (!(o instanceof Map)) continue;
      try {
        Map<String, Object> r = (Map<String, Object>) o;
        // author: hotels shape {author_name} vs maps shape {user: {name}}
        String author = "Guest";
        if (r.get("author_name") != null && !String.valueOf(r.get("author_name")).isBlank()) {
          author = String.valueOf(r.get("author_name")).strip();
        } else if (r.get("user") instanceof Map um && um.get("name") != null
            && !String.valueOf(um.get("name")).isBlank()) {
          author = String.valueOf(um.get("name")).strip();
        } else if (r.get("username") != null && !String.valueOf(r.get("username")).isBlank()) {
          author = String.valueOf(r.get("username")).strip();
        }
        Double rating = null;
        if (r.get("rating") != null) {
          try { rating = Double.parseDouble(String.valueOf(r.get("rating")).split(" ")[0]); }
          catch (Exception ignored) {}
        }
        String date = "";
        for (String k : List.of("date", "time", "published_date")) {
          if (r.get(k) != null && !String.valueOf(r.get(k)).isBlank()) {
            date = String.valueOf(r.get(k)).strip();
            break;
          }
        }
        String text = "";
        for (String k : List.of("text", "snippet", "description", "review_text", "content")) {
          if (r.get(k) != null && !String.valueOf(r.get(k)).isBlank()) {
            text = String.valueOf(r.get(k)).strip();
            break;
          }
        }
        if (text.length() > 300) text = text.substring(0, 299).strip() + "…";
        String link = "";
        if (r.get("author_link") != null) link = String.valueOf(r.get("author_link"));
        else if (r.get("user") instanceof Map um2 && um2.get("link") != null) {
          link = String.valueOf(um2.get("link"));
        } else if (r.get("link") != null) link = String.valueOf(r.get("link"));
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("author", author);
        e.put("rating", rating);
        e.put("date", date);
        e.put("text", text);
        e.put("link", link == null ? "" : link.strip());
        out.add(e);
      } catch (Exception e) {
        log.warn("skip malformed review entry: {}", e.toString());
      }
    }
    return out;
  }

  public List<Map<String, Object>> parseHotelReviews(Map<String, Object> raw, int cap) {
    return parseReviewList(raw, cap <= 0 ? 5 : cap);
  }

  public List<Map<String, Object>> parseHotelReviews(Map<String, Object> raw) {
    return parseReviewList(raw, 5);
  }

  public List<Map<String, Object>> parsePlaceReviews(Map<String, Object> raw, int cap) {
    return parseReviewList(raw, cap <= 0 ? 5 : cap);
  }

  public List<Map<String, Object>> parsePlaceReviews(Map<String, Object> raw) {
    return parseReviewList(raw, 5);
  }
}
