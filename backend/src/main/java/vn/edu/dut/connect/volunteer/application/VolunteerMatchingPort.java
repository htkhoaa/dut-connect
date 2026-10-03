package vn.edu.dut.connect.volunteer.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface VolunteerMatchingPort {
    record Applicant(UUID applicationId, UUID userId, String preferredTrack, String availability, long version, Instant updatedAt) {}
    List<Applicant> pending(UUID campaignId, List<UUID> applicationIds, int limit);
}
