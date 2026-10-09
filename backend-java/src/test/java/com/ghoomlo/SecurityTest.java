package com.ghoomlo;

import com.ghoomlo.client.GroqClient;
import com.ghoomlo.client.SerpApiClient;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Security regression: rate limits, CORS denial, fail-early validation
// (invalid DTOs must 422 WITHOUT touching SerpApiClient), honest budgets.
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {
  @Autowired MockMvc mockMvc;

  @MockBean SerpApiClient serp;
  @MockBean GroqClient groq;

  private static String planBody(String origin, String destination, int travelers, int budget,
      String dep, String ret, boolean refresh) {
    return "{\"origin\":\"" + origin + "\",\"destination\":\"" + destination
        + "\",\"departure_date\":\"" + dep + "\",\"return_date\":\"" + ret
        + "\",\"travelers\":" + travelers + ",\"budget\":" + budget
        + ",\"force_refresh\":" + refresh + ",\"travel_mode\":\"balanced\"}";
  }

  private static final String VALID_PLAN =
      "{\"origin\":\"DEL\",\"destination\":\"Goa\",\"departure_date\":\"2026-10-10\","
          + "\"return_date\":\"2026-10-13\",\"travelers\":2,\"budget\":60000,"
          + "\"force_refresh\":false,\"travel_mode\":\"balanced\"}";

  @Test
  void invalidPlanIs422WithoutPaidCalls() throws Exception {
    // budget negative, travelers zero, garbage + reversed dates
    String bad = planBody("", "Goa", 0, -500, "garbage", "2020-01-01", true);
    mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON).content(bad))
        .andExpect(status().isUnprocessableEntity());
    mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON)
            .content(planBody("DEL", "Goa", 2, 60000, "2026-10-13", "2026-10-10", false)))
        .andExpect(status().isUnprocessableEntity());
    mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON)
            .content(planBody("DEL", "Goa", 21, 60000, "2026-10-10", "2026-10-13", false)))
        .andExpect(status().isUnprocessableEntity());
    verifyNoInteractions(serp);
    verifyNoInteractions(groq);
  }

  @Test
  @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
  void repeatedPlanRequestsAre429RegardlessOfForceRefresh() throws Exception {
    String badA = planBody("", "Goa", 0, -500, "x", "y", true);
    String badB = planBody("", "Goa", 0, -500, "x", "y", false);
    int limited = 0;
    for (int i = 0; i < 35; i++) {
      var res = mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON)
              .content(i % 2 == 0 ? badA : badB)).andReturn().getResponse();
      if (res.getStatus() == 429) {
        limited++;
        assertFalse(res.getHeader("Retry-After") == null || res.getHeader("Retry-After").isBlank(),
            "429 must carry Retry-After");
      }
    }
    assertTrue(limited > 0, "expected 429s after the budget is spent (force_refresh must not bypass)");
    verifyNoInteractions(serp);
  }

  @Test
  @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
  void spoofedForwardedHeaderDoesNotBypassLimit() throws Exception {
    String bad = planBody("", "Goa", 0, -500, "x", "y", false);
    int limited = 0;
    for (int i = 0; i < 35; i++) {
      var res = mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON)
              .header("X-Forwarded-For", "203.0.113." + i).content(bad))
          .andReturn().getResponse();
      if (res.getStatus() == 429) limited++;
    }
    assertTrue(limited > 0, "rotating X-Forwarded-For must not bypass the per-IP budget");
  }

  @Test
  void disallowedOriginGetsNoCorsHeaders() throws Exception {
    mockMvc.perform(options("/api/plan")
            .header("Origin", "https://evil.test")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
  }

  @Test
  void oversizedAssistantContextIsRejectedBeforeGroq() throws Exception {
    StringBuilder big = new StringBuilder();
    for (int i = 0; i < 9000; i++) big.append('z');
    String body = "{\"destination\":\"Goa\",\"request\":\"What is cheapest?\","
        + "\"trip_prices\":{\"blob\":\"" + big + "\"}}";
    mockMvc.perform(post("/api/assistant").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnprocessableEntity());
    verifyNoInteractions(groq);
  }

  @Test
  @DirtiesContext(methodMode = DirtiesContext.MethodMode.BEFORE_METHOD)
  void overBudgetTripReportsNegativeRemaining() throws Exception {
    Map<String, Object> flight = new LinkedHashMap<>();
    flight.put("airline", "Test Air");
    flight.put("price", 90000);
    flight.put("duration", "2h");
    flight.put("stops", 0);
    Map<String, Object> hotel = new LinkedHashMap<>();
    hotel.put("name", "Test Stay");
    hotel.put("rating", 4.0);
    hotel.put("price_per_night", 5000);
    hotel.put("total_price", 15000);
    when(serp.fetchFlightsRaw(any(), any(), any(), any(), anyInt(), anyBoolean()))
        .thenReturn(Map.of());
    when(serp.parseFlights(any(), anyInt())).thenReturn(List.of(flight));
    when(serp.fetchHotelsRaw(any(), any(), any(), anyInt(), anyBoolean()))
        .thenReturn(Map.of());
    when(serp.parseHotels(any(), anyInt())).thenReturn(List.of(hotel));
    when(serp.fetchPlacesRaw(any(), any(), anyBoolean()))
        .thenThrow(new RuntimeException("no places"));
    when(serp.fetchEventsRaw(any(), any(), any(), anyBoolean())).thenReturn(Map.of());
    when(serp.parseEvents(any(), any(), any())).thenReturn(List.of());
    String body = planBody("DEL", "Goa", 2, 10000, "2026-10-10", "2026-10-13", false);
    mockMvc.perform(post("/api/plan").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fits_budget").value(false))
        .andExpect(jsonPath("$.remaining_budget").value(-95000));
  }
}
