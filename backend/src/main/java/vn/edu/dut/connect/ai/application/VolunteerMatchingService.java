package vn.edu.dut.connect.ai.application;

import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.ai.application.AiService.*;

/** Orchestrates reads and external calls; deliberately has no write port or transaction. */
@Service
public class VolunteerMatchingService {
    private static final long BATCH_BUDGET_NANOS = java.time.Duration.ofSeconds(45).toNanos();
    public record Recommendation(UUID applicationId, int score, Track recommendedTrack, List<String> matchedSkills,
                                 List<String> missingSkills, String reason, Confidence confidence) {}
    public record Response(Instant generatedAt, String model, List<Recommendation> recommendations) {}
    public record Availability(boolean available, int maxApplicants) {}
    private final MatchingSnapshots snapshots;
    private final AiService ai;
    public VolunteerMatchingService(MatchingSnapshots snapshots, AiService ai) { this.snapshots = snapshots; this.ai = ai; }

    public Availability availability(UUID campaign, UUID actor) {
        snapshots.authorize(campaign, actor);
        try { ai.requireAvailable(); return new Availability(true, ai.maxApplicants()); }
        catch (ApplicationFailure e) {
            if (e.status() != 503) throw e;
            return new Availability(false, ai.maxApplicants());
        }
    }

    public Response match(UUID campaignId, UUID actor, List<UUID> ids) {
        if (ids != null && (ids.isEmpty() || ids.size() > ai.maxApplicants() || ids.stream().anyMatch(Objects::isNull) || new HashSet<>(ids).size() != ids.size()))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Select distinct application IDs within the configured matching limit");
        var snapshot = snapshots.read(campaignId, actor, ids, ai.maxApplicants());
        ai.requireAvailable();
        var context = snapshot.campaign();
        var redactor = new MatchingTextRedactor(snapshot.profiles().values().stream().flatMap(p -> p.privateTerms().stream()).toList());
        var campaign = new Campaign(redactor.redact(context.title()), redactor.redact(context.description()), redactor.redact(context.volunteerRequirements()), context.requiredSkills().stream()
                .map(s -> new RequiredSkill(s.name(), s.track(), s.importance())).toList());
        long deadline = System.nanoTime() + BATCH_BUDGET_NANOS;
        List<Recommendation> results = new ArrayList<>();
        for (var applicant : snapshot.applicants()) {
            if (System.nanoTime() >= deadline) throw new ApplicationFailure(503, "AI_PROVIDER_UNAVAILABLE", "Matching time limit reached; select fewer applicants and retry");
            var profile = snapshot.profiles().get(applicant.userId());
            var candidate = new Candidate(UUID.randomUUID().toString(), applicant.preferredTrack(), profile.skills(), redactor.redact(profile.experience()), redactor.redact(applicant.availability()));
            var result = ai.evaluateVolunteer(new VolunteerMatchInput(campaign, candidate));
            results.add(new Recommendation(applicant.applicationId(), result.score(), result.recommendedTrack(), result.matchedSkills(), result.missingSkills(), result.reason(), result.confidence()));
        }
        if (!snapshot.applicants().isEmpty()) {
            MatchingSnapshots.Snapshot current;
            try {
                current = snapshots.read(campaignId, actor, snapshot.applicants().stream().map(a -> a.applicationId()).toList(), ai.maxApplicants());
            } catch (ApplicationFailure e) {
                if (e.status() == 400) throw new ApplicationFailure(409, "CONFLICT", "Applicants changed while matching; refresh and generate new suggestions");
                throw e;
            }
            if (!snapshot.equals(current)) throw new ApplicationFailure(409, "CONFLICT", "Matching inputs changed; refresh applicants and generate new suggestions");
        } else snapshots.authorize(campaignId, actor);
        return new Response(Instant.now(), ai.model(), List.copyOf(results));
    }
}
