package vn.edu.dut.connect.volunteer.application;

import java.util.*;
import java.time.Instant;
import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import vn.edu.dut.connect.volunteer.domain.*;

public final class CoordinationContracts {
    private CoordinationContracts() {
    }

    public record MeetingRequest(String title, String description, MeetingType meetingType, Instant startsAt,
                                 Instant endsAt, String location, String meetingUrl, Set<String> clearFields,
                                 @PositiveOrZero Long version) {
    }


    public record SessionRequest(String title, Instant startsAt, Instant endsAt, @PositiveOrZero Long version) {
    }

    public record AttendanceInput(@NotNull UUID userId, @NotNull AttendanceStatus status) {
    }

    public record AttendanceRequest(@NotNull @PositiveOrZero Long version,
                                    @NotNull @Size(min = 1, max = 100) List<@NotNull @Valid AttendanceInput> records) {
    }



    public record MeetingDto(UUID id, UUID campaignId, String title, String description, MeetingType meetingType,
                             Instant startsAt, Instant endsAt, String location, String meetingUrl, UUID createdByUserId,
                             Instant createdAt, Instant updatedAt, Long version, boolean canManage) {
    }


    public record SessionDto(UUID id, UUID campaignId, String title, Instant startsAt, Instant endsAt,
                             UUID createdByUserId, Instant createdAt, Instant updatedAt, Long version) {
    }

    public record AttendanceRow(UUID id, UUID sessionId, UUID userId, AttendanceStatus status, UUID recordedByUserId,
                                Instant recordedAt, Instant updatedAt) {
    }

    public record AttendanceDto(UUID id, UUID sessionId, UUID userId, String fullName, String studentId,
                                AttendanceStatus status, UUID recordedByUserId, Instant recordedAt, Instant updatedAt) {
    }

    public record AttendanceResult(SessionDto session, List<AttendanceDto> records) {
    }


}
