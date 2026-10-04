package com.ghoomlo.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Mirrors backend/main.py static mount:
//   _FRONTEND_DIST = <repo>/frontend-react/dist (preferred)
//   _FRONTEND_LEGACY = <repo>/frontend (fallback)
//   app.mount("/", StaticFiles(directory=..., html=True))
// Serves the built React UI on the same port (hash router — no SPA fallback
// needed). API controllers take precedence over the /** resource handler.
// When no frontend dir exists (e.g. CI), this is a no-op and the API still runs.
@Configuration
public class FrontendConfig implements WebMvcConfigurer {
  private static final Logger log = LoggerFactory.getLogger(FrontendConfig.class);

  private static final List<Path> CANDIDATES = List.of(
      Paths.get("..", "frontend-react", "dist"),
      Paths.get("frontend-react", "dist"),
      Paths.get("..", "frontend"),
      Paths.get("frontend"));

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path frontend = null;
    for (Path c : CANDIDATES) {
      try {
        if (Files.isDirectory(c)) {
          frontend = c.toAbsolutePath().normalize();
          break;
        }
      } catch (Exception ignored) {
      }
    }
    if (frontend == null) {
      log.info("No frontend dir found — serving API only");
      return;
    }
    String location = frontend.toUri().toString();
    if (!location.endsWith("/")) location += "/";
    log.info("Serving frontend from {}", location);
    registry.addResourceHandler("/**")
        .addResourceLocations(location)
        .setCachePeriod(0);
  }

  @Override
  public void addViewControllers(ViewControllerRegistry registry) {
    // StaticFiles(html=True) serves index.html for "/".
    for (Path c : CANDIDATES) {
      try {
        if (Files.isDirectory(c)
            && (Files.exists(c.resolve("index.html")))) {
          registry.addViewController("/").setViewName("forward:/index.html");
          break;
        }
      } catch (Exception ignored) {
      }
    }
  }
}
