package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import vn.edu.dut.connect.shared.application.EmailNotificationService;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@Service
public class PasswordlessLoginService {
    private static final Pattern DUT_EMAIL = Pattern.compile("^[0-9]{9}@sv1\\.dut\\.udn\\.vn$");
    private final JdbcClient jdbc;
    private final TokenIssuer tokens;
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final AuthenticationService authentication;
    private final EmailNotificationService email;
    private final PasswordEncoder passwords;
    private final String frontendUrl;

    public PasswordlessLoginService(JdbcClient jdbc, TokenIssuer tokens, UserRepository users, ProfileRepository profiles,
                                    AuthenticationService authentication, EmailNotificationService email, PasswordEncoder passwords,
                                    @Value("${app.mail.frontend-url}") String frontendUrl) {
        this.jdbc = jdbc; this.tokens = tokens; this.users = users; this.profiles = profiles;
        this.authentication = authentication; this.email = email; this.passwords = passwords; this.frontendUrl = frontendUrl;
    }

    @Transactional
    public void request(LoginLinkRequest request) {
        String address = request.email().trim().toLowerCase();
        if (!DUT_EMAIL.matcher(address).matches())
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Use your DUT student email");
        String studentId = address.substring(0, 9);
        String fullName = request.fullName() == null || request.fullName().isBlank() ? null : request.fullName().trim();
        String faculty = request.faculty() == null || request.faculty().isBlank() ? null : request.faculty().trim();
        if ((fullName == null) != (faculty == null))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Name and faculty must be supplied together for a new account");
        if (faculty != null) Faculties.require(faculty);
        String raw = tokens.randomRefreshToken();
        Instant now = Instant.now();
        jdbc.sql("insert into email_login_tokens(id,email,token_hash,full_name,faculty,expires_at,created_at) values (:id,:email,:hash,:name,:faculty,:expires,:created)")
                .param("id", UUID.randomUUID()).param("email", address).param("hash", tokens.hash(raw))
                .param("name", fullName).param("faculty", faculty)
                .param("expires", now.plusSeconds(900)).param("created", now).update();
        email.loginLink(address, frontendUrl + "/login?token=" + raw);
    }

    @Transactional
    public Session verify(String raw) {
        if (raw == null || raw.length() > 256) throw invalid();
        var token = jdbc.sql("select * from email_login_tokens where token_hash=:hash and consumed_at is null and expires_at > now() for update")
                .param("hash", tokens.hash(raw)).query((rs, row) -> new LoginToken(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getString("full_name"), rs.getString("faculty"))).optional().orElseThrow(PasswordlessLoginService::invalid);
        jdbc.sql("update email_login_tokens set consumed_at=now() where id=:id").param("id", token.id()).update();
        var user = users.findEmail(token.email()).orElseGet(() -> {
            if (token.fullName() == null || token.faculty() == null)
                throw new ApplicationFailure(409, "PROFILE_REQUIRED", "Complete your name and faculty before requesting a login link");
            String studentId = token.email().substring(0, 9);
            return users.saveUser(new vn.edu.dut.connect.identity.domain.User(studentId, token.email(),
                    passwords.encode(tokens.randomRefreshToken()), token.fullName().trim(), vn.edu.dut.connect.identity.domain.GlobalRole.USER));
        });
        if (token.fullName() != null && profiles.findProfile(user.id()).isEmpty())
            profiles.saveProfile(new vn.edu.dut.connect.identity.domain.StudentProfile(user.id(), token.faculty().trim()));
        return authentication.issue(user, Instant.now());
    }

    private static ApplicationFailure invalid() {
        return new ApplicationFailure(401, "INVALID_LOGIN_LINK", "This login link is expired or invalid");
    }
    private record LoginToken(UUID id, String email, String fullName, String faculty) {}
}
