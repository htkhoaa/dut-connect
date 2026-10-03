package vn.edu.dut.connect.identity.api;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Duration;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.identity.application.GoogleSignInService;
import vn.edu.dut.connect.identity.application.IdentityContracts.AuthResponse;
import vn.edu.dut.connect.identity.infrastructure.security.IdentitySettings;

@RestController
@RequestMapping("/api/v1/auth/google")
public class GoogleAuthenticationController {
    private static final String NONCE_COOKIE = "dut_google_nonce";
    public record Credential(@NotBlank @Size(max=12000) String credential) {}
    public record Registration(@NotBlank @Size(max=12000) String credential,
                               @NotBlank @Size(max=32) String studentId, @NotBlank @Size(max=150) String faculty) {}
    public record LoginResult(AuthResponse session, boolean registrationRequired, String email, String fullName) {}
    private final GoogleSignInService service;
    private final RefreshCookie refresh;
    private final IdentitySettings settings;
    public GoogleAuthenticationController(GoogleSignInService service, RefreshCookie refresh, IdentitySettings settings) {
        this.service = service; this.refresh = refresh; this.settings = settings;
    }
    @GetMapping("/configuration")
    public GoogleSignInService.Configuration configuration() { return service.configuration(); }
    @PostMapping("/challenge")
    public GoogleSignInService.Challenge challenge(HttpServletResponse response) {
        var result = service.challenge();
        nonce(response, result.nonce(), Duration.ofMinutes(5));
        return result;
    }
    @PostMapping("/login")
    public LoginResult login(@Valid @RequestBody Credential body, @CookieValue(name=NONCE_COOKIE, required=false) String nonce, HttpServletResponse response) {
        var result = service.login(body.credential(), nonce);
        if (result.session() != null) {
            refresh.set(response, result.session().refreshToken());
            nonce(response, "", Duration.ZERO);
        }
        return new LoginResult(result.session() == null ? null : result.session().response(), result.registrationRequired(), result.email(), result.fullName());
    }
    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody Registration body, @CookieValue(name=NONCE_COOKIE, required=false) String nonce, HttpServletResponse response) {
        var session = service.register(body.credential(), nonce, body.studentId(), body.faculty());
        refresh.set(response, session.refreshToken()); nonce(response, "", Duration.ZERO);
        return session.response();
    }
    @PostMapping("/link")
    public ResponseEntity<Void> link(Authentication actor, @Valid @RequestBody Credential body,
                                     @CookieValue(name=NONCE_COOKIE, required=false) String nonce, HttpServletResponse response) {
        service.link(UUID.fromString(actor.getName()), body.credential(), nonce);
        nonce(response, "", Duration.ZERO);
        return ResponseEntity.noContent().build();
    }
    private void nonce(HttpServletResponse response, String value, Duration age) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(NONCE_COOKIE, value).httpOnly(true).secure(settings.secure())
                .sameSite("Lax").path("/api/v1/auth/google").maxAge(age).build().toString());
    }
}
