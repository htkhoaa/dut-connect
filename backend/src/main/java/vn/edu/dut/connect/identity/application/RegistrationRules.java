package vn.edu.dut.connect.identity.application;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import vn.edu.dut.connect.shared.application.ApplicationFailure;

public final class RegistrationRules {
    private RegistrationRules() {
    }

    public static String email(String email) {
        return normalized(email.trim().toLowerCase(Locale.ROOT), 255, "Email");
    }

    public static String studentId(String id) {
        return normalized(id.trim().toUpperCase(Locale.ROOT), 32, "Student ID");
    }

    public static void password(String value) {
        if (value.length() < 8 || value.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Password must contain at least 8 characters and at most 72 UTF-8 bytes");
    }

    public static void version(long actual, long expected) {
        if (actual != expected)
            throw new ApplicationFailure(409, "OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again.");
    }

    private static String normalized(String value, int maximum, String field) {
        if (value.isBlank() || value.length() > maximum)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", field + " exceeds its length limit after normalization");
        return value;
    }
}
