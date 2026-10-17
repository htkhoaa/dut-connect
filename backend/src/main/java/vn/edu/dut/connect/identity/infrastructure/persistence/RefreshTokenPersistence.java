package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.time.Instant;
import java.sql.Timestamp;
import java.util.*;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.domain.RefreshToken;
import vn.edu.dut.connect.identity.application.RefreshTokenRepository;

@Repository
public class RefreshTokenPersistence implements RefreshTokenRepository {
    private final JdbcClient jdbc;

    public RefreshTokenPersistence(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<RefreshToken> findToken(String hash) {
        return find(hash, "");
    }

    public Optional<RefreshToken> lockToken(String hash) {
        return find(hash, " for update");
    }

    private Optional<RefreshToken> find(String hash, String lock) {
        return jdbc.sql("select * from dut_connect_midterm.refresh_tokens where token_hash=:hash" + lock).param("hash", hash)
                .query((rs, row) -> new RefreshToken(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class),
                        rs.getString("token_hash"), rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("revoked_at") == null ? null : rs.getTimestamp("revoked_at").toInstant())).optional();
    }

    public void insertToken(RefreshToken token, Instant now) {
        jdbc.sql("insert into dut_connect_midterm.refresh_tokens(id,user_id,token_hash,expires_at,created_at) values (:id,:user,:hash,:expiry,:now)")
                .param("id", token.id()).param("user", token.userId()).param("hash", token.hash())
                .param("expiry", Timestamp.from(token.expiresAt())).param("now", Timestamp.from(now)).update();
    }

    public void revokeToken(UUID id, UUID replacement, Instant now) {
        jdbc.sql("update dut_connect_midterm.refresh_tokens set revoked_at=:now,replaced_by_token_id=:replacement where id=:id")
                .param("now", Timestamp.from(now)).param("replacement", replacement).param("id", id).update();
    }

    public void revokeSession(UUID userId, String hash, Instant now) {
        jdbc.sql("""
                WITH RECURSIVE session_tokens AS (
                    SELECT id, replaced_by_token_id FROM dut_connect_midterm.refresh_tokens
                    WHERE user_id=:user AND token_hash=:hash
                    UNION
                    SELECT t.id, t.replaced_by_token_id FROM dut_connect_midterm.refresh_tokens t
                    JOIN session_tokens previous ON t.id=previous.replaced_by_token_id
                    WHERE t.user_id=:user
                )
                UPDATE dut_connect_midterm.refresh_tokens SET revoked_at=:now
                WHERE user_id=:user AND revoked_at IS NULL
                    AND id IN (SELECT id FROM session_tokens)
                """)
                .param("user", userId).param("hash", hash).param("now", Timestamp.from(now)).update();
    }

    public void revokeUserTokens(UUID id, Instant now) {
        jdbc.sql("update dut_connect_midterm.refresh_tokens set revoked_at=:now where user_id=:id and revoked_at is null")
                .param("now", Timestamp.from(now)).param("id", id).update();
    }
}
