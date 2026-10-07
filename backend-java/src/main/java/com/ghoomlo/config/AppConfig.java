package com.ghoomlo.config;

import io.netty.channel.ChannelOption;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

// Mirrors backend/serpapi_client.py _search() + Groq REST calls.
// SerpApi: GET https://serpapi.com/search.json?engine=...&api_key=...
// Groq:    POST https://api.groq.com/openai/v1/chat/completions
@Configuration
public class AppConfig {

  @Value("${serpapi.timeout-seconds:20}")
  private int serpApiTimeoutSeconds;

  @Bean
  public WebClient serpApiWebClient() {
    // SerpApi's edge intermittently RSTs reused keep-alive connections
    // ("Connection reset" on read). Short idle eviction + bounded lifetime
    // keeps the pool from serving dead sockets, and explicit timeouts stop
    // one hung socket from parking a search past the 20s call budget.
    ConnectionProvider provider = ConnectionProvider.builder("serpapi")
        .maxConnections(50)
        .maxIdleTime(Duration.ofSeconds(20))
        .maxLifeTime(Duration.ofMinutes(5))
        .evictInBackground(Duration.ofSeconds(30))
        .build();
    HttpClient httpClient = HttpClient.create(provider)
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
        .responseTimeout(Duration.ofSeconds(25));
    return WebClient.builder()
        .baseUrl("https://serpapi.com")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
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
