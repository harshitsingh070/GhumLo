package com.ghoomlo.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

// Port of backend/nlparse.py parse_nl_trip() — heuristic only (Groq refine lives in GroqClient).
@Service
public class NlParseService {

  private static final List<String> KNOWN = List.of("goa","jaipur","manali","mumbai","delhi",
      "london","kerala","udaipur","agra","varanasi","rishikesh","leh","darjeeling","coorg",
      "ooty","pondicherry","amritsar","jaisalmer","mysore","bengaluru","bangalore","chennai",
      "hyderabad","kolkata","pune","thailand","bali","dubai","singapore","paris","new york");

  private LocalDate nextWeekendSat() {
    LocalDate today = LocalDate.now();
    int daysAhead = (6 - today.getDayOfWeek().getValue() + 7) % 7; // Saturday=6 in ISO (Mon=1)
    // Python: (5 - weekday)%7 with Mon=0 Saturday=5 — same result
    if (daysAhead == 0) daysAhead = 7;
    return today.plusDays(daysAhead);
  }

  private String title(String s) {
    String[] parts = s.strip().split("\\s+");
    StringBuilder b = new StringBuilder();
    for (String p : parts) {
      if (p.isEmpty()) continue;
      if (b.length() > 0) b.append(" ");
      b.append(Character.toUpperCase(p.charAt(0)));
      if (p.length() > 1) b.append(p.substring(1).toLowerCase());
    }
    return b.toString();
  }

  // Mirrors parse_nl_trip()
  public Map<String, Object> parseNlTrip(String text) {
    Map<String, Object> out = new LinkedHashMap<>();
    if (text == null) return out;
    String t = text.strip();
    String low = t.toLowerCase();
    if (t.isEmpty()) return out;

    // budget — mirrors nlparse.py: bm chain first, then generic-number
    // fallback gated on budget/₹/rs context.
    Pattern bm = Pattern.compile("(?:under|below|within|budget|rs\\.?|\u20B9)\\s*(\\d[\\d,]*)\\s*(lakh|lac|l|k|thousand)?");
    Pattern lakh = Pattern.compile("(\\d[\\d,]*)\\s*(lakh|lac)\\b");
    Pattern kb = Pattern.compile("(\\d+)\\s*k\\b");
    Pattern generic = Pattern.compile("\u20B9?\\s*(\\d[\\d,]*)\\s*(lakh|lac|l|k|thousand)?");
    Matcher m = bm.matcher(low);
    if (m.find()) {
      double num = Double.parseDouble(m.group(1).replace(",", ""));
      String unit = m.group(2) == null ? "" : m.group(2).toLowerCase();
      if (unit.equals("lakh") || unit.equals("lac") || unit.equals("l")) num *= 100000;
      else if (unit.equals("k") || unit.equals("thousand")) num *= 1000;
      else if (num < 1000 && num > 0) num *= 1000;
      if (num >= 5000 && num <= 5000000) out.put("budget", (int) num);
    } else {
      Matcher ml = lakh.matcher(low);
      Matcher mk = kb.matcher(low);
      if (ml.find()) {
        double num = Double.parseDouble(ml.group(1).replace(",", "")) * 100000;
        if (num >= 5000 && num <= 5000000) out.put("budget", (int) num);
      } else if (mk.find()) {
        double num = Double.parseDouble(mk.group(1)) * 1000;
        if (num >= 5000 && num <= 5000000) out.put("budget", (int) num);
      } else if (low.contains("budget") || t.contains("\u20B9") || low.contains("rs")) {
        Matcher mg = generic.matcher(low);
        if (mg.find()) {
          double num = Double.parseDouble(mg.group(1).replace(",", ""));
          String unit = mg.group(2) == null ? "" : mg.group(2).toLowerCase();
          if (unit.equals("lakh") || unit.equals("lac") || unit.equals("l")) num *= 100000;
          else if (unit.equals("k") || unit.equals("thousand")) num *= 1000;
          if (num >= 5000 && num <= 5000000) out.put("budget", (int) num);
        }
      }
    }

    // travelers
    Matcher tm = Pattern.compile("(\\d+)\\s*(people|persons?|travellers?|travelers?|pax|adults?|members?)").matcher(low);
    if (tm.find()) {
      int n = Math.max(1, Math.min(9, Integer.parseInt(tm.group(1))));
      out.put("travelers", n);
    } else if (Pattern.compile("\\bcouple\\b|honeymoon|for two\\b|2 of us").matcher(low).find()) {
      out.put("travelers", 2);
    } else if (Pattern.compile("\\bsolo\\b|alone|just me\\b").matcher(low).find()) {
      out.put("travelers", 1);
    } else {
      Matcher fm = Pattern.compile("\\bfamily of (\\d)").matcher(low);
      if (fm.find()) out.put("travelers", Math.max(1, Math.min(9, Integer.parseInt(fm.group(1)))));
    }

    // origin
    Matcher om = Pattern.compile("\\bfrom\\s+([a-zA-Z]{3,20})").matcher(t);
    if (om.find()) out.put("origin", om.group(1).strip());

    // destination
    Matcher dm = Pattern.compile("\\bto\\s+([A-Za-z][A-Za-z ]{2,24}?)(?:\\s+(?:under|below|within|for|next|this|in|on|from|with|budget|cheap|saver|comfort|luxury|trip|\u20B9)|\\s+\\d|[,.]|$)").matcher(t);
    if (dm.find()) {
      String cand = dm.group(1).strip().replaceAll("[,.]+$", "");
      if (cand.length() >= 3) out.put("destination", title(cand));
    }
    if (!out.containsKey("destination")) {
      for (String d : KNOWN) {
        if (Pattern.compile("\\b" + Pattern.quote(d) + "\\b").matcher(low).find()) {
          out.put("destination", d.equals("new york") ? "New York" : title(d));
          break;
        }
      }
    }

    // dates
    Matcher iso = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})").matcher(t);
    java.util.List<String> isos = new java.util.ArrayList<>();
    while (iso.find()) isos.add(iso.group(1));
    if (isos.size() >= 2) {
      out.put("departure_date", isos.get(0));
      out.put("return_date", isos.get(1));
    } else if (isos.size() == 1) {
      out.put("departure_date", isos.get(0));
    } else if (low.contains("next weekend")) {
      LocalDate sat = nextWeekendSat();
      out.put("departure_date", sat.toString());
      out.put("return_date", sat.plusDays(3).toString());
    } else if (low.contains("this weekend")) {
      LocalDate today = LocalDate.now();
      int off = (6 - today.getDayOfWeek().getValue() + 7) % 7;
      LocalDate sat = today.plusDays(off);
      out.put("departure_date", sat.toString());
      out.put("return_date", sat.plusDays(2).toString());
    } else if (low.contains("next month")) {
      LocalDate today = LocalDate.now();
      LocalDate first = today.plusMonths(1).withDayOfMonth(10);
      out.put("departure_date", first.toString());
      out.put("return_date", first.plusDays(3).toString());
    }

    // mode
    if (Pattern.compile("\\b(luxury|comfort|premium|best|4\\s*star|5\\s*star)\\b").matcher(low).find()) {
      out.put("travel_mode", "comfort");
    } else if (Pattern.compile("\\b(cheap|cheapest|saver|low.?cost|backpacker)\\b").matcher(low).find()) {
      out.put("travel_mode", "saver");
    }

    // diet
    java.util.List<String> diet = new java.util.ArrayList<>();
    if (Pattern.compile("\\bveg\\b|vegetarian").matcher(low).find()) diet.add("veg");
    if (Pattern.compile("\\bjain\\b").matcher(low).find()) diet.add("jain");
    if (Pattern.compile("\\bhalal\\b").matcher(low).find()) diet.add("halal");
    if (!diet.isEmpty()) out.put("diet", String.join(", ", diet));

    return out;
  }
}
