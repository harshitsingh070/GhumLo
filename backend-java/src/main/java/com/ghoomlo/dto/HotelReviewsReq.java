package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HotelReviewsReq(
    @JsonProperty("property_token") String property_token,
    @JsonProperty("force_refresh") boolean force_refresh) {}
