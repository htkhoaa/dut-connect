package vn.edu.dut.connect.identity.application;

import java.util.*;
import java.time.Instant;

import jakarta.validation.constraints.*;
import vn.edu.dut.connect.identity.domain.*;

public final class IdentityContracts {
    private IdentityContracts() {
    }

    public record RegisterRequest(@NotBlank @Size(max = 32) String studentId,
                                  @NotBlank @Size(max = 150) String fullName,
                                  @NotBlank @Email @Size(max = 255) String email,
                                  @NotBlank @Size(min = 8, max = 72) String password,
                                  @NotBlank @Size(max = 150) String faculty) {
        public RegisterRequest {
            email = email == null ? null : email.trim();
        }
    }

    public record LoginRequest(@NotBlank @Email @Size(max = 255) String email,
                               @NotBlank @Size(max = 72) String password) {
        public LoginRequest {
            email = email == null ? null : email.trim();
        }
    }

    public record UserSummary(UUID id, String studentId, String email, String fullName, GlobalRole role,
                              AccountStatus status, long version, Instant createdAt) {
        public static UserSummary from(User user) {
            return new UserSummary(user.id(), user.studentId(), user.email(),
                    user.fullName(), user.role(), user.status(), user.version(), user.createdAt());
        }
    }

    public record AuthResponse(String accessToken, String tokenType, long expiresIn, UserSummary user) {
    }

    public record Session(AuthResponse response, String refreshToken) {
    }

    public record SkillResponse(UUID id, String name, boolean active) {
        public static SkillResponse from(Skill skill) {
            return new SkillResponse(skill.id(), skill.name(), skill.active());
        }
    }

    public record ProfileResponse(UserSummary user, String faculty, String bio, ContributionTrack preferredTrack,
                                  String experience, long version, List<SkillResponse> skills) {
    }

    public record ProfileRequest(@NotBlank @Size(max = 150) String fullName,
                                 @NotBlank @Size(max = 150) String faculty, @Size(max = 500) String bio,
                                 ContributionTrack preferredTrack,
                                 @Size(max = 10000) String experience, @NotNull @PositiveOrZero Long version,
                                 @NotNull @PositiveOrZero Long userVersion) {
    }

    public record SkillsRequest(@NotNull @Size(max = 100) List<@NotNull UUID> skillIds,
                                @NotNull @PositiveOrZero Long version) {
    }

    public record StatusRequest(@NotNull AccountStatus status, @NotNull @PositiveOrZero Long version) {
    }
}
