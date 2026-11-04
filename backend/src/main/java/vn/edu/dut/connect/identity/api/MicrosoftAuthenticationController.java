package vn.edu.dut.connect.identity.api;

import java.time.Duration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.identity.application.MicrosoftSignInService;
import vn.edu.dut.connect.identity.application.MicrosoftSignInService.LoginState;

@RestController
@RequestMapping("/api/v1/auth/microsoft")
public class MicrosoftAuthenticationController {
    private static final String STATE = "dut_microsoft_state";
    private static final String VERIFIER = "dut_microsoft_verifier";
    private final MicrosoftSignInService service;
    private final RefreshCookie refresh;
    public MicrosoftAuthenticationController(MicrosoftSignInService service, RefreshCookie refresh) { this.service = service; this.refresh = refresh; }

    @GetMapping("/configuration")
    public MicrosoftSignInService.Configuration configuration() { return service.configuration(); }

    @GetMapping("/authorize")
    public void authorize(HttpServletResponse response) throws java.io.IOException {
        LoginState state = service.state();
        cookie(response, STATE, state.state(), Duration.ofMinutes(10));
        cookie(response, VERIFIER, state.verifier(), Duration.ofMinutes(10));
        response.sendRedirect(service.authorizationUrl(state));
    }

    @GetMapping("/callback")
    public void callback(@RequestParam String code, @RequestParam String state,
                         @CookieValue(name = STATE, required = false) String expectedState,
                         @CookieValue(name = VERIFIER, required = false) String verifier,
                         HttpServletResponse response) throws java.io.IOException {
        try {
            var session = service.callback(code, state, expectedState == null || verifier == null ? null : new LoginState(expectedState, verifier));
            refresh.set(response, session.refreshToken());
            cookie(response, STATE, "", Duration.ZERO); cookie(response, VERIFIER, "", Duration.ZERO);
            response.sendRedirect(UriComponentsBuilder.fromUriString(service.frontendUrl()).path("/me/profile").build().toUriString());
        } catch (ApplicationFailure failure) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(service.frontendUrl()).path("/login")
                    .queryParam("oauth_error", failure.code()).build().toUriString());
        }
    }

    private void cookie(HttpServletResponse response, String name, String value, Duration age) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value).httpOnly(true).secure(service.secure())
                .sameSite("Lax").path("/api/v1/auth/microsoft").maxAge(age).build().toString());
    }
}
