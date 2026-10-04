package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlacesReq(
    @JsonProperty("location") String location,
    @JsonProperty("category") String category,
    @JsonProperty("force_refresh") boolean force_refresh) {}
