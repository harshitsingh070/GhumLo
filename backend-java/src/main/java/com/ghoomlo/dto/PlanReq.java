package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Mirrors backend/main.py class PlanReq. All constraints fail fast (422)
// before any SerpApi/Groq call: travelers 1..20, positive budget,
// non-blank bounded locations, strict ISO dates with end >= start.
@ChronologicalDates
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlanReq(
    @JsonProperty("origin") @NotBlank @Size(min = 1, max = 100) String origin,
    @JsonProperty("destination") @NotBlank @Size(min = 1, max = 100) String destination,
    @JsonProperty("departure_date") @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String departure_date,
    @JsonProperty("return_date") @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String return_date,
    @JsonProperty("travelers") @Min(1) @Max(20) int travelers,
    @JsonProperty("budget") @Min(1) @Max(1000000000) int budget,
    @JsonProperty("force_refresh") boolean force_refresh,
    @JsonProperty("selected_hotel_name") @Size(max = 200) String selected_hotel_name,
    @JsonProperty("travel_mode") @Size(max = 20) String travel_mode) implements DatedRange {
  @Override
  public String startDate() { return departure_date(); }
  @Override
  public String endDate() { return return_date(); }
}
