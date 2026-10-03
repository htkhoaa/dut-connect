package vn.edu.dut.connect.volunteer.domain;

import java.time.Instant;

public final class CoordinationValues {
    private CoordinationValues() {
    }

    public static String text(String value, String field, int max, boolean required) {
        if (value != null && value.indexOf(0) >= 0) invalid(field, "Text cannot contain null characters");
        value = value == null ? null : value.trim();
        if (required && (value == null || value.isEmpty())) invalid(field, "Enter a nonblank value");
        if (value != null && value.length() > max) invalid(field, "Use at most " + max + " characters");
        return value == null || value.isEmpty() ? null : value;
    }

    public static void identifier(java.util.UUID value, String field) {
        if (value == null) invalid(field, "Identifier is required");
    }

    public static void period(Instant start, Instant end) {
        if (start == null || end == null || !end.isAfter(start)) invalid("endsAt", "End must be after start");
    }

    public static void version(Long actual, Long expected) {
        if (expected == null || expected < 0) invalid("version", "Supply a nonnegative expected version");
        if (actual == null || !actual.equals(expected))
            throw new VolunteerViolation("OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again.", null);
    }

    public static void invalid(String field, String message) {
        throw new VolunteerViolation("VALIDATION_ERROR", message, field);
    }

    public static void state(String message) {
        throw new VolunteerViolation("INVALID_STATE_TRANSITION", message, null);
    }
}
