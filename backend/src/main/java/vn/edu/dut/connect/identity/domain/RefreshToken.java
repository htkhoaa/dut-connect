package vn.edu.dut.connect.identity.domain;

import java.time.Instant;
import java.util.UUID;

public record RefreshToken(UUID id, UUID userId, String hash, Instant expiresAt, Instant revokedAt) {
    public boolean isActive(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }
}
