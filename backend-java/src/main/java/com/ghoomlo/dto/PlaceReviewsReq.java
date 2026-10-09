package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlaceReviewsReq(
    @JsonProperty("place_id") @Size(max = 500) String place_id,
    @JsonProperty("data_id") @Size(max = 500) String data_id,
    @JsonProperty("force_refresh") boolean force_refresh) {}
