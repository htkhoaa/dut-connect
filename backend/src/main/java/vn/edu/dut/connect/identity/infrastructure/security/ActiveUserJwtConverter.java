package vn.edu.dut.connect.identity.infrastructure.security;

import java.util.*;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.core.*;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.identity.application.IdentityAccess;
import vn.edu.dut.connect.identity.domain.User;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class ActiveUserJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final IdentityAccess access;

    public ActiveUserJwtConverter(IdentityAccess access) {
        this.access = access;
    }

    public AbstractAuthenticationToken convert(Jwt jwt) {
        try {
            User user = access.activeUser(UUID.fromString(jwt.getSubject()));
            return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name())), user.id().toString());
        } catch (ApplicationFailure | IllegalArgumentException e) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_token"), "Account unavailable");
        } catch (DataAccessResourceFailureException | CannotCreateTransactionException e) {
            throw new OAuth2AuthenticationException(new OAuth2Error("temporarily_unavailable"), "Account lookup temporarily unavailable");
        }
    }
}
