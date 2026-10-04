package com.ghoomlo.config;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Minimal .env loader mirroring Python's load_dotenv() in backend/main.py.
// Spring Boot does NOT read .env files natively, so without this the Java
// backend would ignore the repo .env (SERPAPI_API_KEY, GROQ_API_KEY, ...)
// unless the user manually exports every variable.
// Real environment variables always win over .env values. Only logs whether
// keys are present — never their values.
public final class DotEnv {
  private static final Logger log = LoggerFactory.getLogger(DotEnv.class);

  private static final List<Path> CANDIDATES = List.of(
      Paths.get(".env"),
      Paths.get("..", ".env"));

  private DotEnv() {
  }

  public static void load() {
    Path envFile = null;
    for (Path c : CANDIDATES) {
      try {
        if (Files.isRegularFile(c)) {
          envFile = c.toAbsolutePath().normalize();
          break;
        }
      } catch (Exception ignored) {
      }
    }
    if (envFile == null) {
      log.info("No .env file found — using environment variables");
      logStatus("startup");
      return;
    }
    int loaded = 0;
    try {
      for (String raw : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
        String line = raw.strip();
        if (line.isEmpty() || line.startsWith("#")) continue;
        if (line.startsWith("export ")) line = line.substring(7).strip();
        int eq = line.indexOf('=');
        if (eq <= 0) continue;
        String key = line.substring(0, eq).strip();
        String value = line.substring(eq + 1).strip();
        if (key.isEmpty() || !key.matches("[A-Za-z_][A-Za-z0-9_]*")) continue;
        if (value.length() >= 2
            && ((value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'")))) {
          value = value.substring(1, value.length() - 1);
        }
        // Real env wins: only fill System properties when neither the
        // process environment nor a JVM property already defines the key.
        if (System.getenv(key) != null) continue;
        if (System.getProperty(key) != null) continue;
        System.setProperty(key, value);
        loaded++;
      }
      log.info("Loaded {} entries from {}", loaded, envFile);
    } catch (Exception e) {
      log.warn("Failed to read {}: {}", envFile, e.toString());
    }
    logStatus(envFile.toString());
  }

  private static void logStatus(String source) {
    boolean serpapi = has("SERPAPI_API_KEY", "serpapi.api-key");
    boolean groq = has("GROQ_API_KEY", "groq.api-key");
    log.info("API keys from {} — SERPAPI configured: {}, GROQ configured: {}",
        source, serpapi, groq);
    if (!serpapi) {
      log.warn("SERPAPI_API_KEY missing — live search will fail; add it to .env (see .env.example)");
    }
  }

  private static boolean has(String envKey, String propKey) {
    String env = System.getenv(envKey);
    if (env != null && !env.isBlank()
        && !env.equals("your_key_here") && !env.equals("your_groq_key_here")) {
      return true;
    }
    String prop = System.getProperty(envKey, System.getProperty(propKey, ""));
    return prop != null && !prop.isBlank()
        && !prop.equals("your_key_here") && !prop.equals("your_groq_key_here");
  }
}
