package com.ghoomlo.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Mirrors backend/main.py @app.get("/api/health")
@RestController
public class HealthController {
  @GetMapping("/api/health")
  public Map<String, Boolean> health() {
    return Map.of("ok", true);
  }
}
