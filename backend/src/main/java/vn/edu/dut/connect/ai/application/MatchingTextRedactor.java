package vn.edu.dut.connect.ai.application;

import java.util.Collection;
import java.util.Comparator;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Removes recognizable contact/identity text without adding private fields to AI input DTOs. */
public class MatchingTextRedactor {
    private static final String REPLACEMENT = "[redacted]";
    private static final Pattern EMAIL = Pattern.compile("[\\p{L}\\p{N}._%+\\-]+@[\\p{L}\\p{N}.\\-]+\\.[\\p{L}]{2,}", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern UUID = Pattern.compile("(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    private final Pattern knownTerms;

    public MatchingTextRedactor(Collection<String> privateTerms) {
        String alternatives = privateTerms.stream().filter(s -> s != null && !s.isBlank()).distinct()
                .sorted(Comparator.comparingInt(String::length).reversed()).map(Pattern::quote).collect(Collectors.joining("|"));
        knownTerms = alternatives.isEmpty() ? null : Pattern.compile("(?<![\\p{L}\\p{N}_])(?:" + alternatives + ")(?![\\p{L}\\p{N}_])", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    }
    public String redact(String text) {
        if (text == null) return null;
        String result = UUID.matcher(EMAIL.matcher(text).replaceAll(REPLACEMENT)).replaceAll(REPLACEMENT);
        return knownTerms == null ? result : knownTerms.matcher(result).replaceAll(REPLACEMENT);
    }
}
