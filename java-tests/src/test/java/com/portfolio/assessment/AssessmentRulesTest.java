package com.portfolio.assessment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AssessmentRulesTest {
  @Test
  void normalizesContactFields() {
    assertEquals("user@example.com", AssessmentRules.normalizeEmail("  USER@Example.COM "));
    assertEquals("9171112222", AssessmentRules.normalizePhilippineMobile("+63 917 111 2222"));
    assertEquals("9171112222", AssessmentRules.normalizePhilippineMobile("0917-111-2222"));
  }

  @Test
  void duplicateKeyIsStableForPunctuationAndCaseVariants() {
    String first = AssessmentRules.buildDuplicateKey("Juan Dela Cruz", "1999-05-12");
    String second = AssessmentRules.buildDuplicateKey("juan dela-cruz", "1999-05-12");
    String third = AssessmentRules.buildDuplicateKey("Juan---Dela   Cruz", "1999-05-12");
    assertEquals(first, second);
    assertEquals(first, third);
  }

  @Test
  void consultationDateRulesMatchExpectedInvariants() {
    Clock fixed = Clock.fixed(Instant.parse("2026-04-10T00:00:00Z"), ZoneOffset.UTC);
    assertTrue(AssessmentRules.isTomorrowOrLater(LocalDate.parse("2026-04-11"), fixed));
    assertFalse(AssessmentRules.isTomorrowOrLater(LocalDate.parse("2026-04-10"), fixed));
    assertTrue(AssessmentRules.isWeekday(LocalDate.parse("2026-04-13")));
    assertFalse(AssessmentRules.isWeekday(LocalDate.parse("2026-04-12")));
  }
}
