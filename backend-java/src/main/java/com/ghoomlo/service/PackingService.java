package com.ghoomlo.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

// Pure rule engine: live SerpApi weather snapshot -> packing checklist.
// Zero SerpApi searches — runs on the already-fetched `weather` object.
// Every item carries its `why` so the UI never shows an unexplained rule.
@Service
public class PackingService {

  private static final Pattern NUM = Pattern.compile("-?\\d+(?:\\.\\d+)?");

  private static Double firstNumber(Object v) {
    if (v == null) return null;
    if (v instanceof Number n) return n.doubleValue();
    Matcher m = NUM.matcher(String.valueOf(v).replace(",", ""));
    if (m.find()) {
      try { return Double.parseDouble(m.group()); } catch (Exception ignored) {}
    }
    return null;
  }

  private static double tempCelsius(Map<String, Object> weather) {
    Double t = firstNumber(weather.get("temperature"));
    if (t == null) return Double.NaN;
    String unit = String.valueOf(weather.getOrDefault("unit", "Celsius")).toLowerCase();
    if (unit.startsWith("f")) return (t - 32) * 5.0 / 9.0;
    return t;
  }

  private static int humidityPct(Map<String, Object> weather) {
    Double h = firstNumber(weather.get("humidity"));
    return h == null ? -1 : (int) Math.round(h);
  }

  private static double windKmh(Map<String, Object> weather) {
    Object w = weather.get("wind");
    if (w == null) return Double.NaN;
    String s = String.valueOf(w).toLowerCase();
    Double v = firstNumber(s);
    if (v == null) return Double.NaN;
    if (s.contains("mph")) return v * 1.60934;
    if (s.contains("m/s")) return v * 3.6;
    return v; // default km/h
  }

  private static double precipScore(Map<String, Object> weather) {
    Object p = weather.get("precipitation");
    if (p == null) return 0;
    String s = String.valueOf(p).toLowerCase();
    Double v = firstNumber(s);
    if (v == null) {
      return (s.contains("rain") || s.contains("shower") || s.contains("storm")) ? 70 : 0;
    }
    if (s.contains("%")) return v; // probability
    return v > 0 ? 60 : 0; // mm amount -> treat any rain as wet
  }

  private static Map<String, Object> item(String name, String why, boolean essential) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("item", name);
    m.put("why", why);
    m.put("essential", essential);
    return m;
  }

  // Mirrors the frontend fallback contract: {summary, based_on, groups[]}
  public Map<String, Object> buildPacking(Map<String, Object> weather, int nights, int travelers) {
    int n = Math.max(1, nights);
    String condition = weather == null ? "" : String.valueOf(weather.getOrDefault("condition", ""));
    String condLow = condition.toLowerCase();
    double tempC = weather == null ? Double.NaN : tempCelsius(weather);
    int humidity = weather == null ? -1 : humidityPct(weather);
    double wind = weather == null ? Double.NaN : windKmh(weather);
    double precip = weather == null ? 0 : precipScore(weather);

    boolean wetWord = condLow.contains("rain") || condLow.contains("drizzle")
        || condLow.contains("shower") || condLow.contains("thunder")
        || condLow.contains("storm") || condLow.contains("monsoon");
    boolean isWet = wetWord || precip >= 40;
    boolean isHumid = humidity >= 70;
    boolean isWindy = !Double.isNaN(wind) && wind >= 20;
    boolean isSunny = condLow.contains("sun") || condLow.contains("clear");
    boolean isSnow = condLow.contains("snow") || condLow.contains("sleet") || condLow.contains("hail");

    String heat;
    if (Double.isNaN(tempC)) heat = "unknown";
    else if (tempC >= 30) heat = "hot";
    else if (tempC >= 20) heat = "warm";
    else if (tempC >= 10) heat = "cool";
    else heat = "cold";

    List<Map<String, Object>> essentials = new ArrayList<>();
    essentials.add(item("Govt photo ID × " + Math.max(1, travelers), "Hotel check-in and airport entry need one ID per traveller.", true));
    essentials.add(item("Phone + charger + power bank", "Maps, tickets and OTPs live on your phone.", true));
    essentials.add(item("Medicines + prescriptions", "Carry your regular dose plus a basic strip.", true));
    essentials.add(item("Toiletries (" + n + "-night kit)", "Scaled for " + n + " night" + (n == 1 ? "" : "s") + ".", true));
    int tops = Math.min(n + 1, 7);
    essentials.add(item(tops + " tops / t-shirts", tops + " sets cover " + n + " night" + (n == 1 ? "" : "s") + " plus travel day.", true));

    List<Map<String, Object>> weatherBased = new ArrayList<>();
    switch (heat) {
      case "hot" -> {
        weatherBased.add(item("Light cotton clothes", "It is " + Math.round(tempC) + "°C right now — breathable fabric matters.", true));
        weatherBased.add(item("Cap + sunglasses + sunscreen", "Strong sun at " + Math.round(tempC) + "°C" + (isSunny ? " and clear sky" : "") + ".", true));
        weatherBased.add(item("1L water bottle", "Heat + walking between stops dehydrates fast.", true));
      }
      case "warm" -> {
        weatherBased.add(item("T-shirts + 1 light jacket", "Pleasant " + Math.round(tempC) + "°C days, cooler evenings.", true));
        weatherBased.add(item("Sunglasses", "Bright spells between clouds.", false));
      }
      case "cool" -> {
        weatherBased.add(item("Jacket + layers + full pants", "Cool " + Math.round(tempC) + "°C — mornings and nights dip further.", true));
      }
      case "cold" -> {
        weatherBased.add(item("Heavy jacket + thermals", "Cold " + Math.round(tempC) + "°C — layer up.", true));
        weatherBased.add(item("Wool cap + gloves + socks", "Extremities lose heat first in the cold.", true));
      }
      default -> {
        weatherBased.add(item("1 versatile jacket", "No temperature reading — a layer covers surprises.", false));
      }
    }
    if (isSnow) {
      weatherBased.add(item("Snow boots + thick socks", "Snow/ice mentioned (" + condition + ").", true));
    }
    if (isWet) {
      String why = wetWord ? "Condition says “" + condition + "”." : "Precipitation reads " + weather.get("precipitation") + ".";
      weatherBased.add(item("Umbrella or raincoat", why + " Stay dry between stops.", true));
      weatherBased.add(item("Waterproof bag cover + quick-dry footwear", "Wet streets ruin canvas shoes and paper tickets.", true));
    }
    if (isHumid) {
      weatherBased.add(item("Extra t-shirt + deodorant", "Humidity " + weather.get("humidity") + " — you will sweat more.", false));
    }
    if (isWindy) {
      weatherBased.add(item("Windcheater, skip loose caps", "Wind " + weather.get("wind") + " — open viewpoints get gusty.", false));
    }
    if (isSunny && !"hot".equals(heat)) {
      weatherBased.add(item("Sunscreen", "Clear sky (" + condition + ") burns even on mild days.", false));
    }

    List<Map<String, Object>> groups = new ArrayList<>();
    Map<String, Object> g1 = new LinkedHashMap<>();
    g1.put("title", "Essentials");
    g1.put("items", essentials);
    Map<String, Object> g2 = new LinkedHashMap<>();
    g2.put("title", "For this weather");
    g2.put("items", weatherBased);
    groups.add(g1);
    groups.add(g2);

    String tempStr = weather != null && weather.get("temperature") != null
        ? String.valueOf(weather.get("temperature")) + "°" : "";
    String summary;
    if (weather == null || (weather.get("temperature") == null && condition.isEmpty())) {
      summary = "No live weather — packed the all-round basics for " + n + " night" + (n == 1 ? "" : "s") + ".";
    } else if (isWet) {
      summary = "Wet spell (" + tempStr + " " + condition + ") — rain cover is non-negotiable.";
    } else if ("hot".equals(heat)) {
      summary = "Hot " + tempStr + " " + condition + " — pack light, sun-safe and hydrated.";
    } else if ("cold".equals(heat)) {
      summary = "Cold " + tempStr + " " + condition + " — pack heavy layers.";
    } else {
      summary = tempStr + " " + condition + " — " + essentials.size() + " basics + " + weatherBased.size() + " weather picks.";
    }

    Map<String, Object> basedOn = new LinkedHashMap<>();
    if (weather != null) {
      for (String k : List.of("temperature", "unit", "condition", "humidity", "wind", "precipitation", "observed")) {
        if (weather.get(k) != null) basedOn.put(k, weather.get(k));
      }
    }
    basedOn.put("nights", n);

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("summary", summary.trim());
    out.put("based_on", basedOn);
    out.put("groups", groups);
    out.put("note", "Based on conditions observed right now — not a forecast for your travel dates. Recheck a day before you fly.");
    return out;
  }
}
