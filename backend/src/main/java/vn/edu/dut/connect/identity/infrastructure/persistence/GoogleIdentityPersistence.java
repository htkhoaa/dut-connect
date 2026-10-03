package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.GoogleIdentityRepository;

@Repository
public class GoogleIdentityPersistence implements GoogleIdentityRepository {
    private final JdbcClient jdbc;
    public GoogleIdentityPersistence(JdbcClient jdbc) { this.jdbc = jdbc; }
    public void challenge(String hash, Instant expiresAt) {
        jdbc.sql("DELETE FROM dut_connect.google_auth_challenges WHERE expires_at < CURRENT_TIMESTAMP - interval '1 day'").update();
        jdbc.sql("INSERT INTO dut_connect.google_auth_challenges(id,nonce_hash,expires_at,created_at) VALUES(:id,:hash,:expiry,CURRENT_TIMESTAMP)")
                .param("id", UUID.randomUUID()).param("hash", hash).param("expiry", Timestamp.from(expiresAt)).update();
    }
    public boolean consume(String hash) {
        return jdbc.sql("UPDATE dut_connect.google_auth_challenges SET used_at=CURRENT_TIMESTAMP WHERE nonce_hash=:hash AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP")
                .param("hash", hash).update() == 1;
    }
    public void lockSubject(String subject) {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtextextended(:subject, 0))")
                .param("subject", "google:" + subject).query((rs, row) -> true).single();
    }
    public Optional<UUID> userForSubject(String subject) {
        return jdbc.sql("SELECT user_id FROM dut_connect.google_identities WHERE subject=:subject").param("subject", subject).query(UUID.class).optional();
    }
    public Optional<String> subjectForUser(UUID id) {
        return jdbc.sql("SELECT subject FROM dut_connect.google_identities WHERE user_id=:id").param("id", id).query(String.class).optional();
    }
    public void link(UUID id, String subject) {
        jdbc.sql("INSERT INTO dut_connect.google_identities(user_id,subject,created_at) VALUES(:id,:subject,CURRENT_TIMESTAMP)")
                .param("id", id).param("subject", subject).update();
    }
}
