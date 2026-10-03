package vn.edu.dut.connect.identity.api;

import jakarta.servlet.http.*;

import java.time.Duration;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.identity.infrastructure.security.IdentitySettings;

@Component
public class RefreshCookie {
    public static final String NAME = "dut_refresh";
    private final IdentitySettings settings;

    public RefreshCookie(IdentitySettings settings) {
        this.settings = settings;
    }

    public void set(HttpServletResponse response, String value) {
        write(response, value, Duration.ofSeconds(settings.refreshSeconds()));
    }

    public void clear(HttpServletResponse response) {
        write(response, "", Duration.ZERO);
    }

    private void write(HttpServletResponse response, String value, Duration age) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(NAME, value).httpOnly(true).secure(settings.secure())
                .sameSite("Lax").path("/api/v1/auth").maxAge(age).build().toString());
    }
}
