package vn.edu.dut.connect.ai.infrastructure;

import java.util.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.ai.application.AiService.*;

/** Treat provider output as untrusted, including claimed skill qualifications. */
public class MatchResponseParser {
    private static final Set<String> FIELDS = Set.of("score", "recommendedTrack", "matchedSkills", "missingSkills", "reason", "confidence");
    private final ObjectMapper json;
    public MatchResponseParser(ObjectMapper json) {
        this.json = json.copy().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                .enable(DeserializationFeature.FAIL_ON_READING_DUP_TREE_KEY);
    }
    public VolunteerMatchResult parse(String body, VolunteerMatchInput input) {
        try {
            var envelope = json.readTree(body);
            if (envelope == null || !envelope.isObject()) throw invalid();
            var choices = envelope.path("choices");
            if (!choices.isArray() || choices.size() != 1 || !"stop".equals(choices.get(0).path("finish_reason").asText())) throw invalid();
            var message = choices.get(0).path("message");
            if (!message.path("content").isTextual() || (message.hasNonNull("refusal") && (!message.path("refusal").isTextual() || !message.path("refusal").asText().isBlank()))) throw invalid();
            var output = json.readTree(message.path("content").textValue());
            if (output == null || !output.isObject()) throw invalid();
            Set<String> names = new HashSet<>(); output.fieldNames().forEachRemaining(names::add);
            if (!names.equals(FIELDS) || !output.path("score").isIntegralNumber() || !output.path("score").canConvertToInt()) throw invalid();
            int score = output.path("score").intValue();
            if (score < 0 || score > 100) throw invalid();
            var track = Track.valueOf(text(output, "recommendedTrack", 20));
            var confidence = Confidence.valueOf(text(output, "confidence", 10));
            var reason = text(output, "reason", 1000);
            Set<String> required = new HashSet<>(); input.campaign().requiredSkills().forEach(s -> required.add(s.name()));
            Set<String> held = new HashSet<>(input.candidate().skills());
            var matched = skills(output.path("matchedSkills"));
            var missing = skills(output.path("missingSkills"));
            if (!required.containsAll(matched) || !held.containsAll(matched) || !required.containsAll(missing) || missing.stream().anyMatch(held::contains)) throw invalid();
            return new VolunteerMatchResult(score, track, matched, missing, reason, confidence);
        } catch (JsonProcessingException | IllegalArgumentException e) { throw invalid(); }
    }
    private static String text(JsonNode node, String field, int max) {
        var value = node.path(field);
        if (!value.isTextual() || value.textValue().isBlank() || value.textValue().length() > max || value.textValue().indexOf('\0') >= 0) throw invalid();
        return value.textValue().trim();
    }
    private static List<String> skills(JsonNode values) {
        if (!values.isArray() || values.size() > 100) throw invalid();
        List<String> result = new ArrayList<>();
        for (var value : values) {
            if (!value.isTextual() || value.textValue().isBlank() || value.textValue().length() > 100) throw invalid();
            result.add(value.textValue());
        }
        if (new HashSet<>(result).size() != result.size()) throw invalid();
        return List.copyOf(result);
    }
    public static ApplicationFailure invalid() {
        return new ApplicationFailure(502, "AI_PROVIDER_UNAVAILABLE", "AI returned an unusable suggestion. Manual application review remains available.");
    }
}
