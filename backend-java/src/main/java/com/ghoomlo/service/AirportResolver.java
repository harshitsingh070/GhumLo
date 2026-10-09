package com.ghoomlo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// Port of backend/serpapi_client.py resolve_city_to_airport() + country_for_city().
// Dataset: src/main/resources/airports.json dumped from Python airportsdata (7884 IATA).
// Fuzzy: exact port of difflib.get_close_matches(q, CITY_NAMES, n=1, cutoff=0.8)
// via an in-file Ratcliff-Obershelp SequenceMatcher (len>=4 gate).
@Service
public class AirportResolver {
  private static final Logger log = LoggerFactory.getLogger(AirportResolver.class);

  // Curated aliases: multi-airport cities, tourist islands/regions whose
  // dataset city differs (Bali -> Denpasar, Male -> "MalAc"), and whole
  // countries mapped to their main international gateway (Thailand -> BKK).
  // Every code below is verified present in airports.json; an unknown code
  // safely resolves to null via the containsKey guard at lookup time.
  private static final Map<String, String> OVERRIDES = Map.ofEntries(
      Map.entry("london", "LHR"),
      Map.entry("new york", "JFK"),
      Map.entry("paris", "CDG"),
      Map.entry("tokyo", "NRT"),
      Map.entry("japan", "NRT"),
      Map.entry("moscow", "SVO"),
      Map.entry("goa", "GOI"),
      // Islands / regions (dataset city names differ or collide, e.g. Bali
      // exact-matches BLC Cameroon without this alias).
      Map.entry("bali", "DPS"),
      Map.entry("phuket", "HKT"),
      Map.entry("maldives", "MLE"),
      Map.entry("male", "MLE"),
      Map.entry("santorini", "JTR"),
      Map.entry("mykonos", "JMK"),
      Map.entry("ibiza", "IBZ"),
      Map.entry("mallorca", "PMI"),
      Map.entry("tenerife", "TFS"),
      Map.entry("hawaii", "HNL"),
      Map.entry("manali", "KUU"),
      Map.entry("shimla", "SLV"),
      // Countries -> main gateway hub.
      Map.entry("thailand", "BKK"),
      Map.entry("malaysia", "KUL"),
      Map.entry("singapore", "SIN"),
      Map.entry("indonesia", "DPS"),
      Map.entry("vietnam", "SGN"),
      Map.entry("south korea", "ICN"),
      Map.entry("korea", "ICN"),
      Map.entry("china", "PEK"),
      Map.entry("hong kong", "HKG"),
      Map.entry("macau", "MFM"),
      Map.entry("taiwan", "TPE"),
      Map.entry("philippines", "MNL"),
      Map.entry("sri lanka", "CMB"),
      Map.entry("nepal", "KTM"),
      Map.entry("bhutan", "PBH"),
      Map.entry("bangladesh", "DAC"),
      Map.entry("myanmar", "RGN"),
      Map.entry("laos", "VTE"),
      Map.entry("mali", "BKO"),
      Map.entry("australia", "SYD"),
      Map.entry("new zealand", "AKL"),
      Map.entry("fiji", "NAN"),
      Map.entry("usa", "JFK"),
      Map.entry("united states", "JFK"),
      Map.entry("uk", "LHR"),
      Map.entry("united kingdom", "LHR"),
      Map.entry("england", "LHR"),
      Map.entry("france", "CDG"),
      Map.entry("italy", "FCO"),
      Map.entry("spain", "MAD"),
      Map.entry("germany", "FRA"),
      Map.entry("netherlands", "AMS"),
      Map.entry("switzerland", "ZRH"),
      Map.entry("austria", "VIE"),
      Map.entry("greece", "ATH"),
      Map.entry("turkey", "IST"),
      Map.entry("egypt", "CAI"),
      Map.entry("south africa", "JNB"),
      Map.entry("kenya", "NBO"),
      Map.entry("mauritius", "MRU"),
      Map.entry("seychelles", "SEZ"),
      Map.entry("canada", "YYZ"),
      Map.entry("mexico", "MEX"),
      Map.entry("brazil", "GRU"),
      Map.entry("argentina", "EZE"),
      Map.entry("uae", "DXB"),
      Map.entry("dubai", "DXB"),
      Map.entry("abu dhabi", "AUH"),
      Map.entry("qatar", "DOH"),
      Map.entry("doha", "DOH"),
      Map.entry("oman", "MCT"),
      Map.entry("kuwait", "KWI"),
      Map.entry("bahrain", "BAH"),
      Map.entry("israel", "TLV"),
      Map.entry("jordan", "AMM"));

  // Spaceless-normalized view ("thai land" -> "thailand") built once.
  private static final Map<String, String> NORMALIZED_OVERRIDES = new HashMap<>();
  static {
    for (Map.Entry<String, String> e : OVERRIDES.entrySet()) {
      NORMALIZED_OVERRIDES.put(e.getKey().replaceAll("[\\s\\-]+", ""), e.getValue());
    }
  }

  private final Map<String, Map<String, String>> airports = new TreeMap<>();
  private final Map<String, List<String>> byCity = new HashMap<>();

  @PostConstruct
  public void load() {
    try (InputStream in = getClass().getResourceAsStream("/airports.json")) {
      if (in == null) { log.warn("airports.json missing — resolver will only passthrough codes"); return; }
      Map<String, Map<String, String>> data = new ObjectMapper().readValue(in,
          new TypeReference<Map<String, Map<String, String>>>() {});
      airports.putAll(data);
      for (Map.Entry<String, Map<String, String>> e : airports.entrySet()) {
        String city = e.getValue().getOrDefault("city", "").toLowerCase(Locale.ROOT);
        byCity.computeIfAbsent(city, k -> new ArrayList<>()).add(e.getKey());
      }
      log.info("AirportResolver loaded {} airports", airports.size());
    } catch (Exception e) {
      log.warn("AirportResolver load failed: {}", e.toString());
    }
  }

  private String preferMain(List<String> codes) {
    List<String> intl = new ArrayList<>();
    for (String c : codes) {
      String nm = airports.getOrDefault(c, Map.of()).getOrDefault("name", "").toLowerCase(Locale.ROOT);
      if (nm.contains("international")) intl.add(c);
    }
    List<String> pool = intl.isEmpty() ? codes : intl;
    pool.sort(String::compareTo);
    return pool.get(0);
  }

  // Mirrors resolve_city_to_airport()
  public synchronized String resolveCityToAirport(String input) {
    if (input == null || input.isBlank()) return null;
    String v = normalizeLocation(input);
    String q = v.toLowerCase(Locale.ROOT);
    if (v.length() == 3 && v.equals(v.toUpperCase()) && airports.containsKey(v)) return v;
    if (OVERRIDES.containsKey(q)) {
      String code = OVERRIDES.get(q);
      return airports.containsKey(code) ? code : null;
    }
    // Spaceless alias ("thai land" -> "thailand"). Runs before city-exact
    // so curated aliases win over coincidental dataset hits (Bali/BLC).
    String compact = q.replaceAll("[\\s\\-]+", "");
    if (NORMALIZED_OVERRIDES.containsKey(compact)) {
      String code = NORMALIZED_OVERRIDES.get(compact);
      return airports.containsKey(code) ? code : null;
    }
    // Typo-tolerant alias match ("baali" -> "bali", ratio 0.89): same
    // difflib >= 0.8 rule as city fuzzy, over the short alias keys only.
    if (q.length() >= 4) {
      String bestAlias = null;
      double bestAliasScore = 0.8;
      boolean hasAliasBest = false;
      for (String alias : OVERRIDES.keySet()) {
        double s = difflibRatio(q, alias);
        if (s >= 0.8 && (!hasAliasBest || s > bestAliasScore)) {
          bestAliasScore = s;
          bestAlias = alias;
          hasAliasBest = true;
        }
      }
      if (bestAlias != null) {
        String code = OVERRIDES.get(bestAlias);
        return airports.containsKey(code) ? code : null;
      }
    }
    if (v.length() == 3 && airports.containsKey(v.toUpperCase())) return v.toUpperCase();
    List<String> exact = byCity.getOrDefault(q, List.of()).stream().filter(airports::containsKey).toList();
    if (exact.size() == 1) return exact.get(0);
    if (exact.size() > 1) return preferMain(new ArrayList<>(exact));
    List<String> cityHits = new ArrayList<>();
    for (Map.Entry<String, Map<String, String>> e : airports.entrySet()) {
      String city = e.getValue().getOrDefault("city", "").toLowerCase(Locale.ROOT);
      if (!city.isEmpty() && city.contains(q)) cityHits.add(e.getKey());
    }
    if (!cityHits.isEmpty()) return preferMain(cityHits);
    List<String> nameHits = new ArrayList<>();
    for (Map.Entry<String, Map<String, String>> e : airports.entrySet()) {
      String nm = e.getValue().getOrDefault("name", "").toLowerCase(Locale.ROOT);
      if (!nm.isEmpty() && nm.contains(q)) nameHits.add(e.getKey());
    }
    if (!nameHits.isEmpty()) return preferMain(nameHits);
    if (q.length() >= 4) {
      // difflib.get_close_matches(q, CITY_NAMES, n=1, cutoff=0.8): best ratio wins.
      String bestCity = null;
      double bestScore = 0.8;
      boolean hasBest = false;
      for (String city : byCity.keySet()) {
        if (city.isEmpty()) continue;
        double s = difflibRatio(q, city);
        if (s >= 0.8 && (!hasBest || s > bestScore
            || (s == bestScore && bestCity != null && city.compareTo(bestCity) > 0))) {
          bestScore = s;
          bestCity = city;
          hasBest = true;
        }
      }
      if (bestCity != null) {
        List<String> codes = byCity.getOrDefault(bestCity, List.of()).stream().filter(airports::containsKey).toList();
        if (codes.size() == 1) return codes.get(0);
        if (codes.size() > 1) return preferMain(new ArrayList<>(codes));
      }
    }
    return null;
  }

  /**
   * Returns the airport dataset's city for a resolved location. Downstream
   * searches use this value so flights, hotels, and local content all target
   * the same place, while the original user label can still be shown in the UI.
   */
  public synchronized String canonicalSearchLocation(String input) {
    String normalized = normalizeLocation(input);
    // Keep named destinations such as Goa and Bali intact: airport metadata
    // often uses a nearby airport locality (for example, Dabolim for Goa).
    // Expand only explicit IATA input, where the city name is the useful
    // search term for hotels and local content.
    if (normalized.length() != 3 || !normalized.equals(normalized.toUpperCase(Locale.ROOT))) {
      return normalized;
    }
    String code = resolveCityToAirport(normalized);
    if (code == null) return normalized;
    String city = airports.getOrDefault(code, Map.of()).getOrDefault("city", "").strip();
    return city.isEmpty() ? normalized : city;
  }

  private static String normalizeLocation(String input) {
    return input == null ? "" : input.strip().replaceAll("\\s+", " ");
  }

  /**
   * Port of CPython difflib.SequenceMatcher.ratio() (Ratcliff-Obershelp).
   * ratio = 2*M / T where M = total matching chars, T = len(a)+len(b).
   * City names are short so autojunk (len>=200) never applies — omitted like
   * the effective Python path for these inputs.
   */
  public static double difflibRatio(String a, String b) {
    int n = a.length();
    int m = b.length();
    if (n == 0 && m == 0) return 1.0;
    if (n == 0 || m == 0) return 0.0;
    Map<Character, List<Integer>> b2j = new HashMap<>();
    for (int j = 0; j < m; j++) {
      char c = b.charAt(j);
      b2j.computeIfAbsent(c, k -> new ArrayList<>()).add(j);
    }
    int matches = matchingBlocks(a, b, b2j);
    return 2.0 * matches / (n + m);
  }

  private static int matchingBlocks(String a, String b, Map<Character, List<Integer>> b2j) {
    int n = a.length();
    int m = b.length();
    int total = 0;
    // queue of (alo, ahi, blo, bhi)
    List<int[]> queue = new ArrayList<>();
    queue.add(new int[]{0, n, 0, m});
    while (!queue.isEmpty()) {
      int[] seg = queue.remove(queue.size() - 1);
      int alo = seg[0], ahi = seg[1], blo = seg[2], bhi = seg[3];
      int[] triple = findLongestMatch(a, b, b2j, alo, ahi, blo, bhi);
      int i = triple[0], j = triple[1], k = triple[2];
      if (k > 0) {
        total += k;
        if (alo < i && blo < j) queue.add(new int[]{alo, i, blo, j});
        if (i + k < ahi && j + k < bhi) queue.add(new int[]{i + k, ahi, j + k, bhi});
      }
    }
    return total;
  }

  private static int[] findLongestMatch(String a, String b, Map<Character, List<Integer>> b2j,
      int alo, int ahi, int blo, int bhi) {
    int besti = alo, bestj = blo, bestsize = 0;
    Map<Integer, Integer> j2len = new HashMap<>();
    for (int i = alo; i < ahi; i++) {
      Map<Integer, Integer> newj2len = new HashMap<>();
      List<Integer> js = b2j.get(a.charAt(i));
      if (js == null) {
        j2len = newj2len;
        continue;
      }
      for (int j : js) {
        if (j < blo) continue;
        if (j >= bhi) break;
        int k = j2len.getOrDefault(j - 1, 0) + 1;
        newj2len.put(j, k);
        if (k > bestsize) {
          bestsize = k;
          besti = i - k + 1;
          bestj = j - k + 1;
        }
      }
      j2len = newj2len;
    }
    // Extend with equal neighbours (no junk in our inputs).
    while (besti > alo && bestj > blo && a.charAt(besti - 1) == b.charAt(bestj - 1)) {
      besti--;
      bestj--;
      bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi
        && a.charAt(besti + bestsize) == b.charAt(bestj + bestsize)) {
      bestsize++;
    }
    return new int[]{besti, bestj, bestsize};
  }

  /**
   * "Did you mean?" candidates for an unresolvable location: top difflib
   * matches over dataset cities plus alias keys (mapped to their codes),
   * de-duplicated by airport code. Pure offline computation — safe to call
   * from error paths. Each entry: {code, city, name}.
   */
  public List<Map<String, String>> suggestAirports(String input, int n) {
    String q = input == null ? "" : input.strip().toLowerCase(Locale.ROOT);
    List<Map<String, String>> out = new ArrayList<>();
    if (q.isEmpty() || n <= 0) return out;
    List<String[]> scored = new ArrayList<>(); // [score, code]
    java.util.Set<String> seen = new java.util.HashSet<>();
    for (Map.Entry<String, List<String>> e : byCity.entrySet()) {
      if (e.getKey().isEmpty()) continue;
      double s = difflibRatio(q, e.getKey());
      for (String code : e.getValue()) {
        if (!airports.containsKey(code) || !seen.add(code)) continue;
        scored.add(new String[]{String.valueOf(s), code});
      }
    }
    for (Map.Entry<String, String> e : OVERRIDES.entrySet()) {
      double s = difflibRatio(q, e.getKey());
      if (airports.containsKey(e.getValue()) && seen.add(e.getValue())) {
        scored.add(new String[]{String.valueOf(s), e.getValue()});
      }
    }
    scored.sort((a, b) -> Double.compare(Double.parseDouble(b[0]), Double.parseDouble(a[0])));
    for (String[] s : scored) {
      if (out.size() >= n) break;
      if (Double.parseDouble(s[0]) < 0.6) break;
      Map<String, String> ap = airports.getOrDefault(s[1], Map.of());
      Map<String, String> entry = new LinkedHashMap<>();
      entry.put("code", s[1]);
      entry.put("city", ap.getOrDefault("city", ""));
      entry.put("name", ap.getOrDefault("name", ""));
      out.add(entry);
    }
    return out;
  }

  // Mirrors country_for_city()
  public String countryForCity(String city) {
    String code = resolveCityToAirport(city == null ? "" : city);
    if (code == null) return null;
    String c = airports.getOrDefault(code, Map.of()).getOrDefault("country", "").strip().toUpperCase();
    return c.isEmpty() ? null : c;
  }
}
