package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@Service
public class AuthenticationService {
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final RefreshTokenRepository refreshTokens;
    private final TokenIssuer tokens;
    private final PasswordEncoder passwords;
    private final String absentUserHash;

    public AuthenticationService(UserRepository users, ProfileRepository profiles, RefreshTokenRepository refreshTokens,
                                 TokenIssuer tokens, PasswordEncoder passwords) {
        this.users = users;
        this.profiles = profiles;
        this.refreshTokens = refreshTokens;
        this.tokens = tokens;
        this.passwords = passwords;
        absentUserHash = passwords.encode(UUID.randomUUID().toString());
    }

    @Transactional
    public UserSummary register(RegisterRequest request) {
        RegistrationRules.password(request.password());
        String email = RegistrationRules.email(request.email()), studentId = RegistrationRules.studentId(request.studentId());
        if (users.findEmail(email).isPresent() || users.studentIdExists(studentId))
            throw ApplicationFailure.conflict("Email or student ID already registered");
        User user = users.saveUser(new User(studentId, email, passwords.encode(request.password()), request.fullName().trim(), GlobalRole.USER));
        profiles.saveProfile(new StudentProfile(user.id(), request.faculty().trim()));
        return UserSummary.from(user);
    }

    @Transactional
    public Session login(LoginRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ApplicationFailure(401, "INVALID_CREDENTIALS", "Invalid email or password");
        User candidate = users.findEmail(RegistrationRules.email(request.email())).orElse(null);
        if (!passwords.matches(request.password(), candidate == null ? absentUserHash : candidate.passwordHash()) || candidate == null)
            throw new ApplicationFailure(401, "INVALID_CREDENTIALS", "Invalid email or password");
        User user = users.lockUser(candidate.id()).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        return issue(user, Instant.now());
    }

    @Transactional
    public Session refresh(String raw) {
        requireCookie(raw);
        String hash = tokens.hash(raw);
        RefreshToken candidate = refreshTokens.findToken(hash).orElseThrow(AuthenticationService::invalidRefresh);
        // Always lock user before token, matching logout and suspension lock order.
        User user = users.lockUser(candidate.userId()).orElseThrow(AuthenticationService::invalidRefresh);
        IdentityAccess.requireActive(user);
        RefreshToken current = refreshTokens.lockToken(hash).orElseThrow(AuthenticationService::invalidRefresh);
        Instant now = Instant.now();
        if (!current.isActive(now)) throw invalidRefresh();
        String replacementRaw = tokens.randomRefreshToken();
        UUID replacementId = UUID.randomUUID();
        refreshTokens.insertToken(new RefreshToken(replacementId, user.id(), tokens.hash(replacementRaw), now.plusSeconds(tokens.refreshSeconds()), null), now);
        refreshTokens.revokeToken(current.id(), replacementId, now);
        return session(user, replacementRaw, now);
    }

    @Transactional
    public void logout(UUID userId, String raw) {
        users.lockUser(userId).orElseThrow(AuthenticationService::invalidRefresh);
        if (raw == null || raw.isBlank()) return;
        // The user lock serializes rotation and logout. An older cookie may have
        // rotated while logout was in flight; revoke its replacement chain too.
        refreshTokens.revokeSession(userId, tokens.hash(raw), Instant.now());
    }

    Session issue(User user, Instant now) {
        String raw = tokens.randomRefreshToken();
        refreshTokens.insertToken(new RefreshToken(UUID.randomUUID(), user.id(), tokens.hash(raw), now.plusSeconds(tokens.refreshSeconds()), null), now);
        return session(user, raw, now);
    }

    private Session session(User user, String raw, Instant now) {
        return new Session(new AuthResponse(tokens.accessToken(user, now), "Bearer", tokens.accessSeconds(), UserSummary.from(user)), raw);
    }

    private static void requireCookie(String raw) {
        if (raw == null || raw.isBlank() || raw.length() > 256) throw invalidRefresh();
    }

    private static ApplicationFailure invalidRefresh() {
        return new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Refresh session unavailable");
    }
}
