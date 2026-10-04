package com.ghoomlo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class HealthTest {
  @Autowired MockMvc mvc;

  @Test
  void healthOk() throws Exception {
    mvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));
  }

  @Test
  void parseTripValidationIs422() throws Exception {
    mvc.perform(post("/api/parse-trip")
            .contentType("application/json")
            .content("{\"text\":\"x\"}"))
        .andExpect(status().is(422));
  }

  @Test
  void assistantOffTopicStays400WithTripPrices() throws Exception {
    // trip_prices must bind cleanly; off-topic is rejected before any Groq
    // call (zero cost) with the flights-aware scope message.
    mvc.perform(post("/api/assistant")
            .contentType("application/json")
            .content("{\"destination\":\"Goa\",\"request\":\"write me python code\","
                + "\"trip_prices\":{\"budget\":60000,\"best_pick\":{\"total_cost\":39400}}}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value(
            org.hamcrest.Matchers.containsString("flights and prices")));
  }

  @Test
  void frontendIndexServed() throws Exception {
    // FrontendConfig serves frontend-react/dist when present (hash router app).
    mvc.perform(get("/"))
        .andExpect(status().isOk());
  }
}
