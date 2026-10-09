package com.ghoomlo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// Port of backend/cache.py — file-based JSON cache protecting SerpApi quota.
// Same filename scheme (<name>_<sha16>.json) so Python and Java share cache
// files when pointed at the same dir. Key blob replicates Python
// json.dumps(params, sort_keys=True, default=str) byte-for-byte for the
// flat str/int params used here (separators ", "/" : ", ensure_ascii).
@Service
public class FileCacheService {
  private static final Logger log = LoggerFactory.getLogger(FileCacheService.class);
  private static final long DEFAULT_TTL = 24 * 3600L;
  // Bounded retention: unique queries must not fill the disk (or an
  // accidentally committed .cache/) without limit. Oldest files pruned
  // past the cap on every write; corrupted entries already read as null.
  private static final int MAX_CACHE_FILES = 1000;
  private final ObjectMapper mapper = new ObjectMapper();

  @Value("${app.use-cache:true}")
  private boolean useCacheEnv;

  @Value("${app.cache-dir:.cache}")
  private String cacheDirProp;

  private boolean enabled() {
    String env = System.getenv("USE_CACHE");
    if (env != null) {
      String v = env.trim().toLowerCase();
      return v.equals("1") || v.equals("true") || v.equals("yes");
    }
    return useCacheEnv;
  }

  private Path cacheDir() {
    // Prefer shared Python cache for interop when it exists.
    Path configured = Paths.get(cacheDirProp);
    if (Files.isDirectory(configured)) return configured;
    Path shared = Paths.get("..", "backend", ".cache");
    if (Files.isDirectory(shared)) return shared;
    Path localBackend = Paths.get("backend", ".cache");
    if (Files.isDirectory(localBackend)) return localBackend;
    Path backendJava = Paths.get("backend-java", ".cache");
    if (Files.isDirectory(backendJava)) return backendJava;
    return configured;
  }

  private Path keyPath(String name, Map<String, Object> params) {
    try {
      String blob = pythonJsonDumps(params);
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] hash = md.digest(blob.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder();
      for (byte b : hash) hex.append(String.format("%02x", b));
      String h = hex.substring(0, 16);
      return cacheDir().resolve(name + "_" + h + ".json");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  /**
   * Replicates Python {@code json.dumps(params, sort_keys=True, default=str)}
   * for cache-key hashing so Java hits Python-written cache files and vice
   * versa. Separators are (", ", ": "), keys sorted, non-ASCII escaped
   * (ensure_ascii=True), unknown values fall back to str() like default=str.
   */
  public static String pythonJsonDumps(Map<String, Object> params) {
    Map<String, Object> sorted = new TreeMap<>(params);
    StringBuilder sb = new StringBuilder("{");
    boolean first = true;
    for (Map.Entry<String, Object> e : sorted.entrySet()) {
      if (!first) sb.append(", ");
      first = false;
      sb.append(pythonJsonString(e.getKey()));
      sb.append(": ");
      sb.append(pythonJsonValue(e.getValue()));
    }
    sb.append("}");
    return sb.toString();
  }

  @SuppressWarnings("unchecked")
  private static String pythonJsonValue(Object v) {
    if (v == null) return "null";
    if (v instanceof String s) return pythonJsonString(s);
    if (v instanceof Boolean b) return b ? "true" : "false";
    if (v instanceof Number) {
      if (v instanceof Double d) {
        if (d.isNaN() || d.isInfinite()) return "null";
        return String.valueOf(d);
      }
      if (v instanceof Float f) {
        if (f.isNaN() || f.isInfinite()) return "null";
        return String.valueOf(f);
      }
      return String.valueOf(v);
    }
    if (v instanceof Map<?, ?> m) {
      Map<String, Object> sorted = new TreeMap<>();
      for (Map.Entry<?, ?> e : m.entrySet()) sorted.put(String.valueOf(e.getKey()), e.getValue());
      return pythonJsonDumps(sorted);
    }
    if (v instanceof Iterable<?> it) {
      StringBuilder sb = new StringBuilder("[");
      boolean first = true;
      for (Object o : it) {
        if (!first) sb.append(", ");
        first = false;
        sb.append(pythonJsonValue(o));
      }
      sb.append("]");
      return sb.toString();
    }
    return pythonJsonString(String.valueOf(v));
  }

  private static String pythonJsonString(String s) {
    StringBuilder sb = new StringBuilder("\"");
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '"' -> sb.append("\\\"");
        case '\\' -> sb.append("\\\\");
        case '\b' -> sb.append("\\b");
        case '\f' -> sb.append("\\f");
        case '\n' -> sb.append("\\n");
        case '\r' -> sb.append("\\r");
        case '\t' -> sb.append("\\t");
        default -> {
          if (c < 0x20 || c > 0x7E) sb.append(String.format("\\u%04x", (int) c));
          else sb.append(c);
        }
      }
    }
    sb.append("\"");
    return sb.toString();
  }

  @SuppressWarnings("unchecked")
  public synchronized Map<String, Object> get(String name, Map<String, Object> params, Long ttlSeconds) {
    if (!enabled()) return null;
    long ttl = ttlSeconds != null ? ttlSeconds : DEFAULT_TTL;
    Path p = keyPath(name, params);
    if (!Files.exists(p)) return null;
    try {
      long age = System.currentTimeMillis() - Files.getLastModifiedTime(p).toMillis();
      if (age > ttl * 1000L) return null;
      String text = Files.readString(p, StandardCharsets.UTF_8);
      return mapper.readValue(text, new TypeReference<Map<String, Object>>() {});
    } catch (Exception e) {
      return null;
    }
  }

  /** Last-resort read ignoring TTL: when the live API is unreachable after
   *  retries, a stale snapshot beats a failed trip. Callers must mark the
   *  result as cached/stale so the UI stays honest about its age. */
  @SuppressWarnings("unchecked")
  public synchronized Map<String, Object> getStale(String name, Map<String, Object> params) {
    if (!enabled()) return null;
    Path p = keyPath(name, params);
    if (!Files.exists(p)) return null;
    try {
      String text = Files.readString(p, StandardCharsets.UTF_8);
      return mapper.readValue(text, new TypeReference<Map<String, Object>>() {});
    } catch (Exception e) {
      return null;
    }
  }

  public synchronized void set(String name, Map<String, Object> params, Map<String, Object> data) {
    if (!enabled()) return;
    try {
      Path dir = cacheDir();
      Files.createDirectories(dir);
      Path p = keyPath(name, params);
      Files.writeString(p, mapper.writeValueAsString(data), StandardCharsets.UTF_8);
      pruneOldest(dir);
    } catch (Exception e) {
      log.warn("[cache] write failed: {}", e.toString());
    }
  }

  private void pruneOldest(Path dir) {
    try (var stream = Files.list(dir)) {
      var files = stream.filter(Files::isRegularFile)
          .sorted((a, b) -> {
            try {
              return Files.getLastModifiedTime(a).compareTo(Files.getLastModifiedTime(b));
            } catch (Exception e) { return 0; }
          }).toList();
      for (int i = 0; i + MAX_CACHE_FILES < files.size(); i++) {
        try { Files.deleteIfExists(files.get(i)); }
        catch (Exception ignored) { break; }
      }
    } catch (Exception e) {
      log.warn("[cache] prune failed: {}", e.toString());
    }
  }
}
