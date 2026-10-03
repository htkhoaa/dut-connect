package vn.edu.dut.connect.volunteer.application;
import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.Instant;
import vn.edu.dut.connect.volunteer.domain.*;
public final class VolunteerContracts {
    private VolunteerContracts() {}
    public record ApplyRequest(@NotNull VolunteerTrack preferredTrack,@NotBlank @Size(max=1000) String motivation,@Size(max=1000) String availability) {}
    public record AcceptRequest(@NotNull VolunteerTrack assignedTrack,@NotNull @PositiveOrZero Long version) {}
    public record RejectRequest(@NotBlank @Size(max=1000) String reason,@NotNull @PositiveOrZero Long version) {}
    public record VersionRequest(@NotNull @PositiveOrZero Long version) {}
    public record ApplicationDto(UUID id,UUID campaignId,String campaignTitle,String campaignSlug,UUID userId,String fullName,String studentId,
        VolunteerTrack preferredTrack,VolunteerTrack assignedTrack,String motivation,String availability,RegistrationStatus status,
        String rejectionReason,UUID reviewedByUserId,Instant reviewedAt,Instant createdAt,Instant updatedAt,Long version) {}
    public record RecruitmentSummary(long accepted,long technical,long logistics,Integer targetVolunteerCount,Integer targetTechnicalCount,Integer targetLogisticsCount,boolean canReview) {}
}
