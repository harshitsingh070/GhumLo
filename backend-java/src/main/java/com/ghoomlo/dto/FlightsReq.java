package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FlightsReq(
    @JsonProperty("origin") String origin,
    @JsonProperty("destination") String destination,
    @JsonProperty("departure_date") String departure_date,
    @JsonProperty("return_date") String return_date,
    @JsonProperty("travelers") int travelers,
    @JsonProperty("force_refresh") boolean force_refresh) {}
