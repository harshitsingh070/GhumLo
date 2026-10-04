package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlaceReviewsReq(
    @JsonProperty("place_id") String place_id,
    @JsonProperty("data_id") String data_id,
    @JsonProperty("force_refresh") boolean force_refresh) {}
