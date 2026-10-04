package com.ghoomlo.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// FastAPI returns 422 for Pydantic validation failures; Spring's default is
// 400. Map Bean Validation failures to 422 so the API contract matches
// backend/main.py (e.g. /api/assistant, /api/parse-trip limits).
@RestControllerAdvice
public class ApiValidationHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .map(f -> f.getField() + " " + f.getDefaultMessage())
        .findFirst()
        .orElse("Invalid request");
    return ResponseEntity.status(422).body(Map.of("error", msg));
  }
}
