package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

// Assistant bounds: destination 1..100, dates <=80, request 2..600,
// itinerary <=30. trip_prices is optional grounded price data from the
// current /api/plan response (best_pick, other_options, budget,
// remaining_budget) so flight/cost questions can be answered from real
// numbers instead of refused or invented.
@JsonIgnoreProperties(ignoreUnknown = true)
public record AssistantReq(
    @JsonProperty("destination") @NotBlank @Size(min = 1, max = 100) String destination,
    @JsonProperty("dates") @Size(max = 80) String dates,
    @JsonProperty("request") @NotBlank @Size(min = 2, max = 600) String request,
    @JsonProperty("itinerary") @Size(max = 30) List<Map<String, Object>> itinerary,
    @JsonProperty("weather") Map<String, Object> weather,
    @JsonProperty("trip_prices") Map<String, Object> tripPrices) {}
