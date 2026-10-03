package vn.edu.dut.connect.identity.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.util.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class IdentitySettings {
    private final byte[] secret;
    private final long accessSeconds, refreshSeconds;
    private final List<String> origins;
    private final boolean secure;

    public IdentitySettings(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.access-token-ttl-minutes}") long minutes,
                            @Value("${app.jwt.refresh-token-ttl-days}") long days,
                            @Value("${app.allowed-origins}") String origins, Environment environment) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (secret.isBlank() || this.secret.length < 32 || secret.contains("replace-with"))
            throw new IllegalStateException("APP_JWT_SECRET must be configured with at least 32 random UTF-8 bytes; example placeholders are not accepted");
        if (minutes < 1 || days < 1)
            throw new IllegalStateException("Invalid token lifetimes");
        accessSeconds = Math.multiplyExact(minutes, 60);
        refreshSeconds = Math.multiplyExact(days, 86400);
        this.origins = Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (this.origins.isEmpty() || this.origins.stream().anyMatch(s -> !validOrigin(s)))
            throw new IllegalStateException("Configure explicit HTTP(S) APP_ALLOWED_ORIGINS");
        secure = environment.matchesProfiles("prod");
    }

    public byte[] secret() {
        return secret.clone();
    }

    public long accessSeconds() {
        return accessSeconds;
    }

    public long refreshSeconds() {
        return refreshSeconds;
    }

    public List<String> origins() {
        return origins;
    }

    public boolean secure() {
        return secure;
    }

    private static boolean validOrigin(String value) {
        try {
            URI uri = URI.create(value);
            return !value.contains("*") && ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                    && uri.getHost() != null && uri.getUserInfo() == null && uri.getRawPath().isEmpty()
                    && uri.getQuery() == null && uri.getFragment() == null
                    && uri.getPort() >= -1 && uri.getPort() <= 65535;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
