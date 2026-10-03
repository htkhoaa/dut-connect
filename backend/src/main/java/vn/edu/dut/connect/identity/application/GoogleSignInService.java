package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import vn.edu.dut.connect.identity.application.GoogleIdentityVerifier.Identity;
import static vn.edu.dut.connect.identity.application.IdentityContracts.Session;

/** Google network verification finishes before the database transaction begins. */
@Service
public class GoogleSignInService {
    public record Configuration(boolean enabled, String clientId) {}
    public record Challenge(String nonce, String clientId) {}
    public record Result(Session session, boolean registrationRequired, String email, String fullName) {}
    private final GoogleIdentityVerifier verifier;
    private final GoogleAccountService accounts;
    private final TokenIssuer tokens;
    public GoogleSignInService(GoogleIdentityVerifier verifier, GoogleAccountService accounts, TokenIssuer tokens) {
        this.verifier = verifier; this.accounts = accounts; this.tokens = tokens;
    }
    public Configuration configuration() { return new Configuration(!verifier.clientId().isBlank(), verifier.clientId()); }
    public Challenge challenge() {
        if (verifier.clientId().isBlank()) throw new vn.edu.dut.connect.shared.application.ApplicationFailure(503, "GOOGLE_UNAVAILABLE", "Đăng nhập Google hiện chưa khả dụng.");
        String nonce = tokens.randomRefreshToken();
        accounts.challenge(tokens.hash(nonce), Instant.now().plusSeconds(300));
        return new Challenge(nonce, verifier.clientId());
    }
    public Result login(String credential, String nonce) {
        Identity identity = verifier.verify(credential, nonce);
        return accounts.login(identity, nonce);
    }
    public Session register(String credential, String nonce, String studentId, String faculty) {
        return accounts.register(verifier.verify(credential, nonce), nonce, studentId, faculty);
    }
    public void link(UUID actor, String credential, String nonce) {
        accounts.link(actor, verifier.verify(credential, nonce), nonce);
    }
}
