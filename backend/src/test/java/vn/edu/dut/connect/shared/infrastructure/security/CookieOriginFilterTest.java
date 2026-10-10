package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import vn.edu.dut.connect.identity.infrastructure.security.IdentitySettings;

import static org.assertj.core.api.Assertions.assertThat;

class CookieOriginFilterTest {

    private ObjectMapper objectMapper;
    private SecurityErrorWriter errors;
    private IdentitySettings settings;
    private CookieOriginFilter filter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        errors = new SecurityErrorWriter(objectMapper);

        // 32-character secret key and allowed origins
        settings = new IdentitySettings(
                "01234567890123456789012345678901",
                15,
                7,
                "http://localhost:5173,http://localhost",
                new MockEnvironment()
        );
        filter = new CookieOriginFilter(settings, errors);
    }

    @Test
    @DisplayName("Allows POST auth request when Origin is in configured allowed list")
    void allowsAuthPostWithValidOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.addHeader("Origin", "http://localhost:5173");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull(); // Chain was executed
    }

    @Test
    @DisplayName("Rejects POST auth request when Origin is from an unknown/malicious domain (CSRF prevention)")
    void rejectsAuthPostWithUntrustedOrigin() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.addHeader("Origin", "http://attacker-evil-site.com");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        // Chain must not proceed
        assertThat(chain.getRequest()).isNull();
        // Must write 403 ACCESS_DENIED
        assertThat(response.getStatus()).isEqualTo(403);

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertThat(json.get("status").asInt()).isEqualTo(403);
        assertThat(json.get("code").asText()).isEqualTo("ACCESS_DENIED");
        assertThat(json.get("message").asText()).contains("A configured Origin is required for cookie authentication");
    }

    @Test
    @DisplayName("Rejects POST auth request when Origin header is completely missing")
    void rejectsAuthPostWithoutOriginHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(chain.getRequest()).isNull();
        assertThat(response.getStatus()).isEqualTo(403);

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertThat(json.get("code").asText()).isEqualTo("ACCESS_DENIED");
    }

    @Test
    @DisplayName("Allows non-auth or GET requests regardless of Origin header")
    void allowsNonAuthRequests() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/campaigns");
        request.addHeader("Origin", "http://external-public-client.com");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }
}
