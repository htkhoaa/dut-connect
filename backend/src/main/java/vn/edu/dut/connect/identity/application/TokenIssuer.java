package vn.edu.dut.connect.identity.application;

import java.time.Instant;

import vn.edu.dut.connect.identity.domain.User;

public interface TokenIssuer {
    String accessToken(User user, Instant now);

    String randomRefreshToken();

    String hash(String raw);

    long accessSeconds();

    long refreshSeconds();
}
