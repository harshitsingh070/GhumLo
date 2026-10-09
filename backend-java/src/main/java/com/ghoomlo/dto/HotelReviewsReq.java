package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HotelReviewsReq(
    @JsonProperty("property_token") @Size(max = 500) String property_token,
    @JsonProperty("force_refresh") boolean force_refresh) {}
