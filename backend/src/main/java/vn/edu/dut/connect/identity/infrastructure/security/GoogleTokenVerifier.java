package vn.edu.dut.connect.identity.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.identity.application.GoogleIdentityVerifier;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class GoogleTokenVerifier implements GoogleIdentityVerifier {
    private final String clientId;
    private final NimbusJwtDecoder decoder;
    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId, RestTemplateBuilder http) {
        this.clientId = clientId.trim();
        decoder = NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .restOperations(http.connectTimeout(Duration.ofSeconds(3)).readTimeout(Duration.ofSeconds(3)).build()).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(Duration.ofSeconds(30)), jwt -> {
            boolean valid = List.of("https://accounts.google.com", "accounts.google.com").contains(jwt.getClaimAsString("iss"))
                    && jwt.getAudience().size() == 1 && jwt.getAudience().contains(this.clientId)
                    && jwt.getExpiresAt() != null && jwt.getIssuedAt() != null;
            return valid ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
        }));
    }
    public String clientId() { return clientId; }
    public Identity verify(String credential, String nonce) {
        if (clientId.isBlank()) throw new ApplicationFailure(503, "GOOGLE_UNAVAILABLE", "Đăng nhập Google hiện chưa khả dụng.");
        if (credential == null || credential.length() > 12000 || nonce == null || nonce.length() > 256) throw invalid();
        try {
            var jwt = decoder.decode(credential);
            String tokenNonce = jwt.getClaimAsString("nonce"), subject = jwt.getSubject(), email = jwt.getClaimAsString("email");
            if (tokenNonce == null || !MessageDigest.isEqual(nonce.getBytes(StandardCharsets.UTF_8), tokenNonce.getBytes(StandardCharsets.UTF_8))
                    || !Boolean.TRUE.equals(jwt.getClaims().get("email_verified")) || subject == null || subject.isBlank() || subject.length() > 255
                    || email == null || email.length() > 255 || !email.contains("@")) throw invalid();
            String name = jwt.getClaimAsString("name");
            if (name == null || name.isBlank()) name = email.substring(0, email.indexOf('@'));
            if (name.length() > 150) name = name.substring(0, 150);
            return new Identity(subject, email.trim().toLowerCase(java.util.Locale.ROOT), name.trim());
        } catch (JwtException | IllegalArgumentException e) { throw invalid(); }
    }
    private static ApplicationFailure invalid() {
        return new ApplicationFailure(401, "INVALID_GOOGLE_CREDENTIAL", "Phiên xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
    }
}
