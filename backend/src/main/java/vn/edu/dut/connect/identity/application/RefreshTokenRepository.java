package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.*;

import vn.edu.dut.connect.identity.domain.RefreshToken;

public interface RefreshTokenRepository {
    Optional<RefreshToken> findToken(String hash);

    Optional<RefreshToken> lockToken(String hash);

    void insertToken(RefreshToken token, Instant createdAt);

    void revokeToken(UUID id, UUID replacementId, Instant now);

    void revokeSession(UUID userId, String tokenHash, Instant now);

    void revokeUserTokens(UUID userId, Instant now);
}
