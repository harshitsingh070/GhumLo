package com.ghoomlo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

// Mirrors backend/serpapi_client.py _search() + Groq REST calls.
// SerpApi: GET https://serpapi.com/search.json?engine=...&api_key=...
// Groq:    POST https://api.groq.com/openai/v1/chat/completions
@Configuration
public class AppConfig {

  @Value("${serpapi.timeout-seconds:20}")
  private int serpApiTimeoutSeconds;

  @Bean
  public WebClient serpApiWebClient() {
    return WebClient.builder()
        .baseUrl("https://serpapi.com")
        .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
        .build();
  }

  @Bean
  public WebClient groqWebClient() {
    return WebClient.builder()
        .baseUrl("https://api.groq.com/openai/v1")
        .codecs(c -> c.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
        .build();
  }
}
