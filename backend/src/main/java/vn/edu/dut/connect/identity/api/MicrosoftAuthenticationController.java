package vn.edu.dut.connect.identity.api;

import java.time.Duration;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.identity.application.MicrosoftSignInService;
import vn.edu.dut.connect.identity.application.MicrosoftSignInService.LoginState;

@RestController
@RequestMapping("/api/v1/auth/microsoft")
public class MicrosoftAuthenticationController {
    private static final Logger log = LoggerFactory.getLogger(MicrosoftAuthenticationController.class);
    private static final String STATE = "dut_microsoft_state";
    private static final String VERIFIER = "dut_microsoft_verifier";
    private static final String NONCE = "dut_microsoft_nonce";
    private final MicrosoftSignInService service;
    private final RefreshCookie refresh;
    public MicrosoftAuthenticationController(MicrosoftSignInService service, RefreshCookie refresh) { this.service = service; this.refresh = refresh; }

    @GetMapping("/configuration")
    public MicrosoftSignInService.Configuration configuration() { return service.configuration(); }

    @GetMapping("/authorize")
    public void authorize(HttpServletResponse response) throws java.io.IOException {
        LoginState state = service.state();
        log.info("Microsoft OAuth authorization started");
        cookie(response, STATE, state.state(), Duration.ofMinutes(10));
        cookie(response, VERIFIER, state.verifier(), Duration.ofMinutes(10));
        cookie(response, NONCE, state.nonce(), Duration.ofMinutes(10));
        response.sendRedirect(service.authorizationUrl(state));
    }

    @GetMapping("/callback")
    public void callback(@RequestParam String code, @RequestParam String state,
                         @CookieValue(name = STATE, required = false) String expectedState,
                         @CookieValue(name = VERIFIER, required = false) String verifier,
    @CookieValue(name = NONCE, required = false) String nonce,
    HttpServletResponse response) throws java.io.IOException {
        log.info("Microsoft OAuth callback received: codePresent={}, statePresent={}, stateCookiePresent={}, verifierCookiePresent={}, nonceCookiePresent={}",
                code != null && !code.isBlank(), state != null && !state.isBlank(),
                expectedState != null, verifier != null, nonce != null);
        try {
            var session = service.callback(code, state, expectedState == null || verifier == null || nonce == null
                    ? null : new LoginState(expectedState, verifier, nonce));
            refresh.set(response, session.refreshToken());
            cookie(response, STATE, "", Duration.ZERO); cookie(response, VERIFIER, "", Duration.ZERO); cookie(response, NONCE, "", Duration.ZERO);
            response.sendRedirect(UriComponentsBuilder.fromUriString(service.frontendUrl()).path("/me/profile").build().toUriString());
        } catch (ApplicationFailure failure) {
            log.warn("Microsoft OAuth callback rejected: code={}", failure.code());
            response.sendRedirect(UriComponentsBuilder.fromUriString(service.frontendUrl()).path("/login")
                    .queryParam("oauth_error", failure.code()).build().toUriString());
        }
    }

    private void cookie(HttpServletResponse response, String name, String value, Duration age) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(name, value).httpOnly(true).secure(service.secure())
                .sameSite(service.secure() ? "None" : "Lax").path("/").maxAge(age).build().toString());
    }
}
