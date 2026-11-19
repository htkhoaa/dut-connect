package vn.edu.dut.connect.identity.application;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MicrosoftSignInServiceTest {
    private final MicrosoftSignInService service = new MicrosoftSignInService(mock(TokenIssuer.class),
            mock(UserRepository.class), mock(ProfileRepository.class), mock(AuthenticationService.class),
            mock(JdbcClient.class), new RestTemplateBuilder(), true, "client", "secret", "tenant",
            "https://example.test/api/v1/auth/microsoft/callback", "https://example.test");
    private final MicrosoftSignInService.LoginState original = new MicrosoftSignInService.LoginState("state", "verifier", "nonce");

    private String state() {
        String query = URI.create(service.authorizationUrl(original)).getRawQuery();
        for (String part : query.split("&")) {
            if (part.startsWith("state=")) return URLDecoder.decode(part.substring(6), StandardCharsets.UTF_8);
        }
        throw new AssertionError("Missing state");
    }

    @Test void rejectsCallbackWithoutBrowserCookiesBeforeContactingMicrosoft() {
        var failure = assertThrows(ApplicationFailure.class, () -> service.callback("unused-code", state(), null));
        assertEquals(401, failure.status());
    }

    @Test void rejectsMismatchedBrowserVerifier() {
        var wrong = new MicrosoftSignInService.LoginState("state", "different", "nonce");
        assertEquals(401, assertThrows(ApplicationFailure.class, () -> service.callback("unused-code", state(), wrong)).status());
    }

    @Test void rejectsMismatchedBrowserNonce() {
        var wrong = new MicrosoftSignInService.LoginState("state", "verifier", "different");
        assertEquals(401, assertThrows(ApplicationFailure.class, () -> service.callback("unused-code", state(), wrong)).status());
    }
}
