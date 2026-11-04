package vn.edu.dut.connect.identity.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static vn.edu.dut.connect.identity.application.IdentityContracts.Session;

@Service
public class MicrosoftSignInService {
    private static final Logger log = LoggerFactory.getLogger(MicrosoftSignInService.class);
    public record Configuration(boolean enabled) {}
    public record LoginState(String state, String verifier, String nonce) {}
    private record TokenResponse(@JsonProperty("id_token") String idToken) {}
    private record Identity(String subject, String tenant, String email, String name) {}

    private static final String STUDENT_EMAIL = "^[0-9]{9}@sv1\\.dut\\.udn\\.vn$";
    private final boolean enabled;
    private final String clientId, clientSecret, tenantId, redirectUri, frontendUrl;
    private final TokenIssuer tokens;
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final AuthenticationService authentication;
    private final JdbcClient jdbc;
    private final RestTemplate http;
    private final NimbusJwtDecoder decoder;

    public MicrosoftSignInService(
            TokenIssuer tokens, UserRepository users, ProfileRepository profiles, AuthenticationService authentication,
            JdbcClient jdbc, RestTemplateBuilder builder,
            @Value("${app.microsoft.enabled:false}") boolean enabled,
            @Value("${app.microsoft.client-id:}") String clientId,
            @Value("${app.microsoft.client-secret:}") String clientSecret,
            @Value("${app.microsoft.tenant-id:}") String tenantId,
            @Value("${app.microsoft.redirect-uri:}") String redirectUri,
            @Value("${app.microsoft.frontend-url:http://localhost}") String frontendUrl) {
        this.enabled = enabled;
        this.clientId = clientId.trim();
        this.clientSecret = clientSecret;
        this.tenantId = tenantId.trim();
        this.redirectUri = redirectUri.trim();
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
        this.tokens = tokens; this.users = users; this.profiles = profiles; this.authentication = authentication; this.jdbc = jdbc;
        this.http = builder.connectTimeout(java.time.Duration.ofSeconds(5)).readTimeout(java.time.Duration.ofSeconds(10)).build();
        if (!this.tenantId.isBlank()) {
            this.decoder = NimbusJwtDecoder.withJwkSetUri("https://login.microsoftonline.com/" + this.tenantId + "/discovery/v2.0/keys").build();
            this.decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                    new JwtTimestampValidator(java.time.Duration.ofSeconds(30)),
                    jwt -> jwt.getAudience().size() == 1 && jwt.getAudience().contains(this.clientId)
                            && ("https://login.microsoftonline.com/" + this.tenantId + "/v2.0").equals(jwt.getClaimAsString("iss"))
                            && this.tenantId.equals(jwt.getClaimAsString("tid"))
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"))));
        } else this.decoder = null;
    }

    public Configuration configuration() {
        return new Configuration(enabled && configured());
    }

    public String frontendUrl() { return frontendUrl; }
    public boolean secure() { return redirectUri.startsWith("https://"); }

    public LoginState state() {
        requireConfigured();
        return new LoginState(tokens.randomRefreshToken(), tokens.randomRefreshToken(), tokens.randomRefreshToken());
    }

    public String authorizationUrl(LoginState state) {
        String stateToken = encodeState(state);
        return UriComponentsBuilder.fromUriString("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/authorize")
                .queryParam("client_id", clientId).queryParam("response_type", "code")
                .queryParam("redirect_uri", redirectUri).queryParam("response_mode", "query")
                .queryParam("scope", "openid profile email").queryParam("state", stateToken)
                .queryParam("code_challenge", challenge(state.verifier())).queryParam("code_challenge_method", "S256")
                .queryParam("nonce", state.nonce()).build().encode().toUriString();
    }

    @Transactional
    public Session callback(String code, String state, LoginState expected) {
        requireConfigured();
        LoginState encoded = decodeState(state);
        if (code == null || code.length() > 4096 || encoded == null)
            throw invalid("state or authorization code is missing or invalid");
        if (expected != null && !constantTime(encoded.state(), expected.state()))
            throw invalid("state mismatch");
        LoginState credentials = encoded;
        TokenResponse response;
        try {
            var form = new LinkedMultiValueMap<String, String>();
            form.add("client_id", clientId); form.add("client_secret", clientSecret); form.add("grant_type", "authorization_code");
            form.add("code", code); form.add("redirect_uri", redirectUri); form.add("code_verifier", credentials.verifier());
            response = http.postForEntity("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token",
                    new HttpEntity<>(form, headers()), TokenResponse.class).getBody();
            if (response == null || response.idToken() == null) throw invalid("Microsoft token response did not contain an id_token");
            var jwt = decoder.decode(response.idToken());
            String nonce = jwt.getClaimAsString("nonce");
            if (!constantTime(credentials.nonce(), nonce)) throw invalid("nonce mismatch");
            String email = jwt.getClaimAsString("preferred_username");
            if (email == null) email = jwt.getClaimAsString("upn");
            if (email == null) email = jwt.getClaimAsString("email");
            if (email == null) email = jwt.getClaimAsString("unique_name");
            email = email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
            // Entra organizational accounts do not consistently emit email_verified;
            // the tenant issuer and the required DUT UPN suffix provide the trust boundary.
            if (!email.matches(STUDENT_EMAIL)) {
                log.warn("Microsoft account rejected: subject={}, tenant={}, emailClaim={}",
                        jwt.getSubject(), jwt.getClaimAsString("tid"), email);
                throw invalid("Microsoft account does not use a DUT student UPN");
            }
            var identity = new Identity(jwt.getSubject(), jwt.getClaimAsString("tid"), email,
                    limit(jwt.getClaimAsString("name"), email.substring(0, 9)));
            if (!tenantId.equals(identity.tenant()) || identity.subject() == null || identity.subject().isBlank())
                throw invalid("Microsoft tenant or subject is invalid");
            return account(identity);
        } catch (RuntimeException ex) {
            log.warn("Microsoft token validation failed: {}", ex.getMessage(), ex);
            if (ex instanceof ApplicationFailure failure) throw failure;
            throw new ApplicationFailure(401, "INVALID_MICROSOFT_CREDENTIAL", "Microsoft authentication failed");
        }
    }

    private Session account(Identity identity) {
        var linked = jdbc.sql("select user_id from dut_connect.microsoft_identities where subject=:subject")
                .param("subject", identity.subject()).query(UUID.class).optional();
        var user = linked.flatMap(users::lockUser).orElseGet(() -> users.findEmail(identity.email()).orElse(null));
        if (user == null) {
            user = users.saveUser(new User(identity.email().substring(0, 9), identity.email(),
                    org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder().encode(tokens.randomRefreshToken()),
                    identity.name(), GlobalRole.USER));
            profiles.saveProfile(new StudentProfile(user.id(), "Chưa cập nhật"));
        }
        IdentityAccess.requireActive(user);
        jdbc.sql("insert into dut_connect.microsoft_identities(user_id,subject,tenant_id,email,created_at) values (:user,:subject,:tenant,:email,now()) on conflict (subject) do update set email=:email")
                .param("user", user.id()).param("subject", identity.subject()).param("tenant", identity.tenant()).param("email", identity.email()).update();
        return authentication.issue(user, Instant.now());
    }

    private HttpHeaders headers() { var h = new HttpHeaders(); h.setContentType(MediaType.APPLICATION_FORM_URLENCODED); return h; }
    private void requireConfigured() {
        if (!configured()) throw new ApplicationFailure(503, "MICROSOFT_UNAVAILABLE", "Microsoft sign-in is not configured");
    }
    private boolean configured() { return enabled && !clientId.isBlank() && !clientSecret.isBlank() && !tenantId.isBlank() && !redirectUri.isBlank() && decoder != null; }
    private static String challenge(String verifier) {
        try { return Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII))); }
        catch (Exception e) { throw new IllegalStateException("SHA-256 unavailable", e); }
    }
    private String encodeState(LoginState state) {
        try {
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            byte[] payload = String.join("\n", state.state(), state.verifier(), state.nonce())
                    .getBytes(StandardCharsets.UTF_8);
            return b64(iv) + "." + b64(cipher.doFinal(payload));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to protect OAuth state", ex);
        }
    }
    private LoginState decodeState(String token) {
        try {
            if (token == null || token.length() > 2048) return null;
            String[] parts = token.split("\\.", -1);
            if (parts.length != 2) return null;
            byte[] iv = Base64.getUrlDecoder().decode(parts[0]);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            String[] values = new String(cipher.doFinal(Base64.getUrlDecoder().decode(parts[1])), StandardCharsets.UTF_8).split("\n", -1);
            return values.length == 3 && values[0].length() <= 256 && values[1].length() <= 256 && values[2].length() <= 256
                    ? new LoginState(values[0], values[1], values[2]) : null;
        } catch (Exception ex) {
            return null;
        }
    }
    private SecretKeySpec key() {
        try {
            return new SecretKeySpec(MessageDigest.getInstance("SHA-256")
                    .digest(clientSecret.getBytes(StandardCharsets.UTF_8)), "AES");
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
    private static String b64(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }
    private static boolean constantTime(String left, String right) {
        return left != null && right != null && MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
    }
    private static String limit(String value, String fallback) {
        String result = value == null || value.isBlank() ? fallback : value.trim();
        return result.length() > 150 ? result.substring(0, 150) : result;
    }
    private static ApplicationFailure invalid(String reason) {
        return new ApplicationFailure(401, "INVALID_MICROSOFT_CREDENTIAL", "Microsoft authentication failed: " + reason);
    }
}
