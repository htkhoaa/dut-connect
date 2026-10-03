package vn.edu.dut.connect.identity.infrastructure.security;

import java.time.Instant;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import vn.edu.dut.connect.identity.application.TokenIssuer;
import vn.edu.dut.connect.identity.domain.User;

@Component
public class NimbusTokenIssuer implements TokenIssuer {
    private final JwtEncoder encoder;
    private final IdentitySettings settings;
    private final SecureRandom random = new SecureRandom();

    public NimbusTokenIssuer(JwtEncoder encoder, IdentitySettings settings) {
        this.encoder = encoder;
        this.settings = settings;
    }

    public String accessToken(User user, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("dut-connect").subject(user.id().toString())
                .issuedAt(now).expiresAt(now.plusSeconds(accessSeconds())).claim("role", user.role().name()).claim("email", user.email()).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public String randomRefreshToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public long accessSeconds() {
        return settings.accessSeconds();
    }

    public long refreshSeconds() {
        return settings.refreshSeconds();
    }
}
