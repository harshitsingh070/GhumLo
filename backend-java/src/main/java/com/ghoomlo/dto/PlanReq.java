package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

// Mirrors backend/main.py class PlanReq
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlanReq(
    @JsonProperty("origin") String origin,
    @JsonProperty("destination") String destination,
    @JsonProperty("departure_date") String departure_date,
    @JsonProperty("return_date") String return_date,
    @JsonProperty("travelers") int travelers,
    @JsonProperty("budget") int budget,
    @JsonProperty("force_refresh") boolean force_refresh,
    @JsonProperty("selected_hotel_name") String selected_hotel_name,
    @JsonProperty("travel_mode") String travel_mode) {}
