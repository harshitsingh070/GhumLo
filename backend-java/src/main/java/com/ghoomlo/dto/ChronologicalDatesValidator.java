package com.ghoomlo.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;

public class ChronologicalDatesValidator implements ConstraintValidator<ChronologicalDates, DatedRange> {
  @Override
  public boolean isValid(DatedRange value, ConstraintValidatorContext context) {
    if (value == null) return true;
    String start = value.startDate();
    String end = value.endDate();
    // Absent/blank ends (one-way flights) and unparseable values pass here;
    // @NotBlank/@Pattern own those cases.
    if (start == null || end == null || start.isBlank() || end.isBlank()) return true;
    LocalDate s;
    LocalDate e;
    try {
      s = LocalDate.parse(start.strip());
      e = LocalDate.parse(end.strip());
    } catch (Exception ex) {
      return true; // format errors belong to @Pattern, not this check
    }
    return !e.isBefore(s);
  }
}
