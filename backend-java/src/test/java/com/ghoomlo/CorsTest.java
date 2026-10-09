package com.ghoomlo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// CORS allowlist: configured origin passes preflight, anything else is denied.
@SpringBootTest(properties = "app.cors.allowed-origins=https://app.example.com")
@AutoConfigureMockMvc
class CorsTest {
  @Autowired MockMvc mockMvc;

  @Test
  void allowedOriginPassesPreflight() throws Exception {
    mockMvc.perform(options("/api/plan")
            .header("Origin", "https://app.example.com")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(header().string("Access-Control-Allow-Origin", "https://app.example.com"));
  }

  @Test
  void disallowedOriginGetsNoCorsHeaders() throws Exception {
    mockMvc.perform(options("/api/plan")
            .header("Origin", "https://evil.test")
            .header("Access-Control-Request-Method", "POST"))
        .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
  }
}
