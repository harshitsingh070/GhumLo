package com.ghoomlo.config;

import io.netty.channel.ChannelOption;
import io.netty.resolver.DefaultAddressResolverGroup;
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

  /** Dedicated pool for blocking SerpApi fan-out. Never use the common
   *  ForkJoinPool for blocking .block() calls — it starves parallel
   *  searches and serializes the whole trip. */
  @Bean("searchExecutor")
  public java.util.concurrent.Executor searchExecutor() {
    java.util.concurrent.ThreadPoolExecutor exec =
        new java.util.concurrent.ThreadPoolExecutor(
            10, 20, 60L, java.util.concurrent.TimeUnit.SECONDS,
            new java.util.concurrent.LinkedBlockingQueue<>(100),
            r -> {
              Thread t = new Thread(r, "search-" + r.hashCode());
              t.setDaemon(true);
              return t;
            },
            new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
    return exec;
  }

  @Bean
  public WebClient serpApiWebClient() {
    // SerpApi's edge intermittently RSTs reused keep-alive connections
    // ("Connection reset" on read). Short idle eviction + bounded lifetime
    // keeps the pool from serving dead sockets, and explicit timeouts stop
    // one hung socket from parking a search past the call budget.
    ConnectionProvider provider = ConnectionProvider.builder("serpapi")
        .maxConnections(50)
        .maxIdleTime(Duration.ofSeconds(20))
        .maxLifeTime(Duration.ofMinutes(5))
        .evictInBackground(Duration.ofSeconds(30))
        .build();
    // Use the OS/JVM DNS resolver instead of Netty's async UDP resolver:
    // on networks where IPv6 DNS or raw UDP is blocked, Netty's resolver
    // times out ("Failed to resolve 'serpapi.com' after 4 queries") while
    // system DNS (curl/browser) works fine.
    HttpClient httpClient = HttpClient.create(provider)
        .resolver(DefaultAddressResolverGroup.INSTANCE)
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
        .responseTimeout(Duration.ofSeconds(15));
    return WebClient.builder()
        .baseUrl("https://serpapi.com")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
        .build();
  }

  @Bean
  public WebClient groqWebClient() {
    // Same OS-DNS fix as SerpApi: api.groq.com hits the identical
    // Netty UDP-DNS timeout on restricted networks. Same pool hygiene too:
    // Groq's edge RSTs stale keep-alive sockets ("Connection reset" on read),
    // so evict idle connections aggressively like the SerpApi pool.
    ConnectionProvider groqProvider = ConnectionProvider.builder("groq")
        .maxConnections(20)
        .maxIdleTime(Duration.ofSeconds(20))
        .maxLifeTime(Duration.ofMinutes(5))
        .evictInBackground(Duration.ofSeconds(30))
        .build();
    HttpClient httpClient = HttpClient.create(groqProvider)
        .resolver(DefaultAddressResolverGroup.INSTANCE)
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
        .responseTimeout(Duration.ofSeconds(30));
    return WebClient.builder()
        .baseUrl("https://api.groq.com/openai/v1")
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .codecs(c -> c.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
        .build();
  }
}
