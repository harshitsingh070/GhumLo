package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HotelsReq(
    @JsonProperty("destination") String destination,
    @JsonProperty("check_in") String check_in,
    @JsonProperty("check_out") String check_out,
    @JsonProperty("travelers") int travelers,
    @JsonProperty("force_refresh") boolean force_refresh) {}
