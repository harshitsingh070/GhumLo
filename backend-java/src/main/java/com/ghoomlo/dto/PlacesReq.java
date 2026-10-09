package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PlacesReq(
    @JsonProperty("location") @NotBlank @Size(min = 1, max = 200) String location,
    @JsonProperty("category") String category,
    @JsonProperty("force_refresh") boolean force_refresh) {}
