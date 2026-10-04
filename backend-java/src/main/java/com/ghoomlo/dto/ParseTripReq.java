package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Mirrors backend/main.py class ParseTripReq: text 2..500 (422 on violation).
@JsonIgnoreProperties(ignoreUnknown = true)
public record ParseTripReq(
    @JsonProperty("text") @NotBlank @Size(min = 2, max = 500) String text) {}
