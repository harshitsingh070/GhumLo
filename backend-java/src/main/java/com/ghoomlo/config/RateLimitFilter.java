package com.ghoomlo.config;

import com.ghoomlo.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

// Edge rate limiting for every paid/external-call endpoint. Runs BEFORE
// deserialization and Bean Validation, so malformed, invalid, and
// force_refresh floods all consume the same per-endpoint budget — no bypass
// by varying payload shape, and no SerpApi/Groq call happens past the limit.
// CORS preflights (OPTIONS) never consume budget.
@Component
public class RateLimitFilter extends OncePerRequestFilter {
  // Endpoint -> {maxHits, windowMs}. Search endpoints share one budget each.
  private static final Map<String, long[]> BUDGETS = Map.of(
      "/api/plan", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/flights", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/hotels", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/places", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/hotels/reviews", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/places/reviews", new long[]{RateLimitService.SEARCH_MAX, RateLimitService.SEARCH_WINDOW_MS},
      "/api/parse-trip", new long[]{RateLimitService.PARSE_MAX, RateLimitService.PARSE_WINDOW_MS},
      "/api/assistant", new long[]{RateLimitService.ASSISTANT_MAX, RateLimitService.ASSISTANT_WINDOW_MS});

  private final RateLimitService rateLimit;

  @Value("${app.trust-proxy-headers:false}")
  private boolean trustProxy;

  public RateLimitFilter(RateLimitService rateLimit) {
    this.rateLimit = rateLimit;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
      FilterChain chain) throws ServletException, IOException {
    long[] budget = BUDGETS.get(req.getRequestURI());
    if (budget == null || "OPTIONS".equalsIgnoreCase(req.getMethod())) {
      chain.doFilter(req, res);
      return;
    }
    String key = RateLimitService.keyFor(req, trustProxy, req.getRequestURI());
    long retryAfter = rateLimit.check(key, (int) budget[0], budget[1]);
    if (retryAfter >= 0) {
      res.setStatus(429);
      res.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfter)));
      res.setContentType("application/json");
      res.getWriter().write("{\"error\":\"Too many requests — please wait a few minutes and try again.\"}");
      return;
    }
    chain.doFilter(req, res);
  }
}
