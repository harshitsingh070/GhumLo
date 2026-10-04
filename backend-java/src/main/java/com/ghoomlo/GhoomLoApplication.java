package com.ghoomlo;

import com.ghoomlo.config.DotEnv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GhoomLoApplication {
  public static void main(String[] args) {
    // Mirror Python's load_dotenv(): pick up repo .env before Spring resolves
    // ${SERPAPI_API_KEY} / ${GROQ_API_KEY} placeholders.
    DotEnv.load();
    SpringApplication.run(GhoomLoApplication.class, args);
  }
}
