package com.ghoomlo.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// Class-level check that the end date is on or after the start date.
// Blank/unparseable values pass here — @NotBlank/@Pattern own those cases.
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ChronologicalDatesValidator.class)
public @interface ChronologicalDates {
  String message() default "return/end date must be on or after departure/start date";
  Class<?>[] groups() default {};
  Class<? extends Payload>[] payload() default {};
}
