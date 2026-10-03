package vn.edu.dut.connect.identity.infrastructure.security;

import java.util.UUID;

import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.Jwt;
import vn.edu.dut.connect.identity.domain.GlobalRole;

/** Validates the required identity claims before any account lookup. */
public final class IdentityJwtValidator implements OAuth2TokenValidator<Jwt> {
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        try {
            String subject = jwt.getSubject();
            if (subject == null || !UUID.fromString(subject).toString().equalsIgnoreCase(subject))
                return invalid();
            GlobalRole.valueOf(jwt.getClaimAsString("role"));
            String email = jwt.getClaimAsString("email");
            if (email == null || email.isBlank() || jwt.getIssuedAt() == null || jwt.getExpiresAt() == null
                    || !jwt.getExpiresAt().isAfter(jwt.getIssuedAt())) return invalid();
            return OAuth2TokenValidatorResult.success();
        } catch (IllegalArgumentException | NullPointerException e) {
            return invalid();
        }
    }

    private static OAuth2TokenValidatorResult invalid() {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Missing or invalid identity claims", null));
    }
}
