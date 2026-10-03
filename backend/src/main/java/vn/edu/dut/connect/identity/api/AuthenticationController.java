package vn.edu.dut.connect.identity.api;

import java.net.URI;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.identity.application.*;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private final AuthenticationService service;
    private final IdentityAccess access;
    private final RefreshCookie cookies;

    public AuthenticationController(AuthenticationService service, IdentityAccess access, RefreshCookie cookies) {
        this.service = service;
        this.access = access;
        this.cookies = cookies;
    }

    @PostMapping("/register")
    public ResponseEntity<UserSummary> register(@Valid @RequestBody RegisterRequest request) {
        UserSummary user = service.register(request);
        return ResponseEntity.created(URI.create("/api/v1/auth/me")).body(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        Session session = service.login(request);
        cookies.set(response, session.refreshToken());
        return session.response();
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@CookieValue(name = RefreshCookie.NAME, required = false) String token, HttpServletResponse response) {
        Session session = service.refresh(token);
        cookies.set(response, session.refreshToken());
        return session.response();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication, @CookieValue(name = RefreshCookie.NAME, required = false) String token, HttpServletResponse response) {
        service.logout(UUID.fromString(authentication.getName()), token);
        cookies.clear(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserSummary me(Authentication authentication) {
        return UserSummary.from(access.activeUser(UUID.fromString(authentication.getName())));
    }
}
