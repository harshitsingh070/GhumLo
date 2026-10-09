package com.ghoomlo.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayDeque;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

// Bounded per-client rate limiter for paid/external-call endpoints.
// Instance-local by design (no shared store): with N app instances each
// instance grants its own budget — noted here so horizontal scaling gets a
// shared store (e.g. gateway limiting) instead of relying on this.
//
// Never trusts X-Forwarded-For unless the operator explicitly enables
// trusted-proxy headers (app.trust-proxy-headers=true) for a deployment
// behind their own proxy. Spoofed headers otherwise count against the real
// remote address, so header rotation cannot bypass limits.
//
// Bounded: at most MAX_CLIENTS tracked buckets; fully-expired buckets are
// purged on access and the oldest buckets evicted past the cap. There is
// deliberately no "clear everything" path — one abusive client can never
// reset anyone else's quota.
@Service
public class RateLimitService {
  private static final int MAX_CLIENTS = 2000;
  // Purge horizon for eviction sweeps: our widest window below.
  private static final long MAX_WINDOW_MS = 600_000L;

  // Expensive search endpoints: 30 requests / 10 min per client.
  public static final int SEARCH_MAX = 30;
  public static final long SEARCH_WINDOW_MS = 600_000L;
  // Assistant (Groq spend): 15 requests / 10 min per client.
  public static final int ASSISTANT_MAX = 15;
  public static final long ASSISTANT_WINDOW_MS = 600_000L;
  // Parse-trip (cheap heuristic, occasional Groq refine): 60 / 10 min.
  public static final int PARSE_MAX = 60;
  public static final long PARSE_WINDOW_MS = 600_000L;

  private final ConcurrentHashMap<String, ArrayDeque<Long>> clients = new ConcurrentHashMap<>();

  /** @return -1 when allowed, otherwise retry-after seconds until budget frees. */
  public synchronized long check(String key, int maxHits, long windowMs) {
    long now = System.currentTimeMillis();
    ArrayDeque<Long> q = clients.computeIfAbsent(key, k -> new ArrayDeque<>());
    while (!q.isEmpty() && now - q.peekFirst() >= windowMs) q.pollFirst();
    if (q.size() >= maxHits) {
      return (q.peekFirst() + windowMs - now + 999) / 1000;
    }
    q.addLast(now);
    if (clients.size() > MAX_CLIENTS) evictOverflow(now);
    return -1;
  }

  private void evictOverflow(long now) {
    // First drop fully-expired buckets (using the widest known window).
    clients.entrySet().removeIf(e -> {
      ArrayDeque<Long> q = e.getValue();
      while (!q.isEmpty() && now - q.peekFirst() >= MAX_WINDOW_MS) q.pollFirst();
      return q.isEmpty();
    });
    // Then oldest keys until back under cap (never a full clear).
    while (clients.size() > MAX_CLIENTS) {
      String oldest = null;
      long oldestTs = Long.MAX_VALUE;
      for (Map.Entry<String, ArrayDeque<Long>> e : clients.entrySet()) {
        Long first = e.getValue().peekFirst();
        long ts = first == null ? Long.MAX_VALUE : first;
        if (ts < oldestTs) { oldestTs = ts; oldest = e.getKey(); }
      }
      if (oldest == null) break;
      clients.remove(oldest);
    }
  }

  /** Client identity: real remote address unless trusted-proxy mode is on. */
  public static String clientIp(HttpServletRequest req, boolean trustProxy) {
    if (trustProxy) {
      String xff = req.getHeader("X-Forwarded-For");
      if (xff != null && !xff.isBlank()) return xff.split(",")[0].strip();
    }
    String remote = req.getRemoteAddr();
    return (remote == null || remote.isBlank()) ? "unknown" : remote;
  }

  /** Per-endpoint bucket key: a flood on one endpoint never starves the rest. */
  public static String keyFor(HttpServletRequest req, boolean trustProxy, String endpoint) {
    return clientIp(req, trustProxy) + "|" + endpoint;
  }

  public static ResponseEntity<Map<String, Object>> rateLimited(long retryAfterSec) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("error", "Too many requests — please wait a few minutes and try again.");
    return ResponseEntity.status(429)
        .header("Retry-After", String.valueOf(Math.max(1, retryAfterSec)))
        .body(body);
  }
}
