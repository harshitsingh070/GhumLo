package com.ghoomlo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@ChronologicalDates
@JsonIgnoreProperties(ignoreUnknown = true)
public record HotelsReq(
    @JsonProperty("destination") @NotBlank @Size(min = 1, max = 100) String destination,
    @JsonProperty("check_in") @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String check_in,
    @JsonProperty("check_out") @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String check_out,
    @JsonProperty("travelers") @Min(1) @Max(20) int travelers,
    @JsonProperty("force_refresh") boolean force_refresh) implements DatedRange {
  @Override
  public String startDate() { return check_in(); }
  @Override
  public String endDate() { return check_out(); }
}
