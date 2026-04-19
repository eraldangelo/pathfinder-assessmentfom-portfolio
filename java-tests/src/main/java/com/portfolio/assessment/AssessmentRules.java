package com.portfolio.assessment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;

public final class AssessmentRules {
  private AssessmentRules() {}

  public static String normalizeEmail(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  public static String normalizePhilippineMobile(String value) {
    if (value == null) return "";
    String digits = value.replaceAll("\\D", "");
    if (digits.isEmpty()) return "";
    if (digits.startsWith("63") && digits.length() >= 12) digits = digits.substring(2);
    if (digits.startsWith("0") && digits.length() >= 11) digits = digits.substring(1);
    if (digits.length() > 10) digits = digits.substring(digits.length() - 10);
    return (digits.length() == 10 && digits.startsWith("9")) ? digits : "";
  }

  public static String buildDuplicateKey(String fullName, String dateOfBirth) {
    String normalizedName = (fullName == null ? "" : fullName.trim())
      .toLowerCase(Locale.ROOT)
      .replaceAll("[^a-z0-9\\s]", " ")
      .replaceAll("\\s+", " ")
      .trim();
    String normalizedDob = dateOfBirth == null ? "" : dateOfBirth.trim();
    return sha256(normalizedName + "|" + normalizedDob);
  }

  public static boolean isWeekday(LocalDate value) {
    int day = value.getDayOfWeek().getValue();
    return day >= 1 && day <= 5;
  }

  public static boolean isTomorrowOrLater(LocalDate value, Clock clock) {
    LocalDate tomorrow = LocalDate.now(clock).plusDays(1);
    return !value.isBefore(tomorrow);
  }

  private static String sha256(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder builder = new StringBuilder(hash.length * 2);
      for (byte item : hash) {
        builder.append(String.format("%02x", item));
      }
      return builder.toString();
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 not available", ex);
    }
  }
}
