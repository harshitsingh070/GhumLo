package com.ghoomlo.config;

import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Explicit origin allowlist — never "*". Empty (default) registers no
// cross-origin mapping at all, so browsers enforce same-origin only, which
// is the production posture (the backend serves the frontend itself).
// Configure via app.cors.allowed-origins / CORS_ALLOWED_ORIGINS, e.g.
// "https://ghoomlo.example.com,http://localhost:5173" for local Vite dev.
@Configuration
public class CorsConfig {
  private static final Logger log = LoggerFactory.getLogger(CorsConfig.class);

  @Value("${app.cors.allowed-origins:}")
  private String allowedOriginsProp;

  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = Arrays.stream(allowedOriginsProp.split(","))
            .map(String::strip)
            .filter(s -> !s.isEmpty())
            .toList();
        if (origins.isEmpty()) {
          log.info("CORS: no allowed origins configured — same-origin only");
          return;
        }
        log.info("CORS: allowing origins {}", origins);
        registry.addMapping("/api/**")
            .allowedOrigins(origins.toArray(new String[0]))
            .allowedMethods("GET", "POST", "OPTIONS")
            .allowedHeaders("Content-Type", "Accept")
            .maxAge(3600);
      }
    };
  }
}
