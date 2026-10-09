package com.ghoomlo.dto;

// Start/end ISO dates (YYYY-MM-DD) exposed uniformly for cross-field checks.
public interface DatedRange {
  String startDate();
  String endDate();
}
