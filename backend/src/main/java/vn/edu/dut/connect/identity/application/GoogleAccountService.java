package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@Service
public class GoogleAccountService {
    private final GoogleIdentityRepository google;
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final AuthenticationService authentication;
    private final PasswordEncoder passwords;
    private final TokenIssuer tokens;
    public GoogleAccountService(GoogleIdentityRepository google, UserRepository users, ProfileRepository profiles,
                                AuthenticationService authentication, PasswordEncoder passwords, TokenIssuer tokens) {
        this.google = google; this.users = users; this.profiles = profiles; this.authentication = authentication;
        this.passwords = passwords; this.tokens = tokens;
    }
    @Transactional
    public void challenge(String hash, Instant expiry) { google.challenge(hash, expiry); }
    @Transactional
    public GoogleSignInService.Result login(GoogleIdentityVerifier.Identity identity, String nonce) {
        google.lockSubject(identity.subject());
        var linked = google.userForSubject(identity.subject());
        if (linked.isEmpty()) {
            if (users.findEmail(identity.email()).isPresent()) throw linkRequired();
            return new GoogleSignInService.Result(null, true, identity.email(), identity.fullName());
        }
        var user = users.lockUser(linked.get()).orElseThrow(() -> ApplicationFailure.missing("Không tìm thấy tài khoản."));
        IdentityAccess.requireActive(user);
        consume(nonce);
        return new GoogleSignInService.Result(authentication.issue(user, Instant.now()), false, user.email(), user.fullName());
    }
    @Transactional
    public Session register(GoogleIdentityVerifier.Identity identity, String nonce, String studentId, String faculty) {
        google.lockSubject(identity.subject());
        if (google.userForSubject(identity.subject()).isPresent()) throw ApplicationFailure.conflict("Tài khoản Google đã được đăng ký. Vui lòng đăng nhập lại.");
        if (users.findEmail(identity.email()).isPresent()) throw linkRequired();
        String normalizedId = RegistrationRules.studentId(studentId);
        if (!normalizedId.matches("[0-9]{9}") || !RegistrationRules.email(identity.email()).equals(normalizedId + "@sv1.dut.udn.vn"))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Student email must match the 9-digit student ID at sv1.dut.udn.vn");
        Faculties.require(faculty);
        if (users.studentIdExists(normalizedId)) throw ApplicationFailure.conflict("Mã sinh viên đã được đăng ký.");
        consume(nonce);
        var user = users.saveUser(new User(normalizedId, identity.email(), passwords.encode(tokens.randomRefreshToken()), identity.fullName(), GlobalRole.USER));
        profiles.saveProfile(new StudentProfile(user.id(), faculty.trim()));
        google.link(user.id(), identity.subject());
        return authentication.issue(user, Instant.now());
    }
    @Transactional
    public void link(UUID actor, GoogleIdentityVerifier.Identity identity, String nonce) {
        google.lockSubject(identity.subject());
        var user = users.lockUser(actor).orElseThrow(() -> ApplicationFailure.missing("Không tìm thấy tài khoản."));
        IdentityAccess.requireActive(user);
        if (!user.email().equals(identity.email())) throw new ApplicationFailure(400, "GOOGLE_EMAIL_MISMATCH", "Hãy chọn tài khoản Google có cùng email với hồ sơ của bạn.");
        var owner = google.userForSubject(identity.subject());
        if (owner.isPresent() && !owner.get().equals(actor)) throw ApplicationFailure.conflict("Tài khoản Google đã liên kết với người dùng khác.");
        var subject = google.subjectForUser(actor);
        if (subject.isPresent() && !subject.get().equals(identity.subject())) throw ApplicationFailure.conflict("Bạn đã liên kết một tài khoản Google khác.");
        consume(nonce);
        if (owner.isEmpty()) google.link(actor, identity.subject());
    }
    private void consume(String nonce) {
        if (!google.consume(tokens.hash(nonce))) throw new ApplicationFailure(401, "INVALID_GOOGLE_CREDENTIAL", "Phiên đăng nhập Google đã được dùng hoặc hết hạn. Vui lòng thử lại.");
    }
    private static ApplicationFailure linkRequired() {
        return new ApplicationFailure(409, "GOOGLE_LINK_REQUIRED", "Email đã có tài khoản. Hãy đăng nhập bằng mật khẩu, rồi liên kết Google trong hồ sơ.");
    }
}
