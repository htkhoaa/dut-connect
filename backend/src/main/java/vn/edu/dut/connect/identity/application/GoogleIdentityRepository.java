package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface GoogleIdentityRepository {
    void challenge(String hash, Instant expiresAt);
    boolean consume(String hash);
    void lockSubject(String subject);
    Optional<UUID> userForSubject(String subject);
    Optional<String> subjectForUser(UUID userId);
    void link(UUID userId, String subject);
}
