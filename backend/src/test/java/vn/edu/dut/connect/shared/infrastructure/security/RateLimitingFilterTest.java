package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingFilterTest {

    private ObjectMapper objectMapper;
    private InMemoryRateLimiter rateLimiter;
    private SecurityErrorWriter errors;
    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        rateLimiter = new InMemoryRateLimiter(2, 60_000); // 2 permits per minute
        errors = new SecurityErrorWriter(objectMapper);
        filter = new RateLimitingFilter(rateLimiter, errors);
    }

    @Test
    @DisplayName("Allows requests to pass when under rate limit threshold")
    void allowsRequestUnderLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull(); // Chain was executed
    }

    @Test
    @DisplayName("Blocks request with 429 TOO_MANY_REQUESTS when limit is exceeded")
    void blocksRequestWhenLimitExceeded() throws ServletException, IOException {
        String clientIp = "10.0.0.5";

        // Consume all 2 permits
        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isNotEqualTo(429);
        }

        // 3rd request should be blocked
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr(clientIp);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
        assertThat(chain.getRequest()).isNull(); // Chain was NOT executed

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertThat(json.get("status").asInt()).isEqualTo(429);
        assertThat(json.get("code").asText()).isEqualTo("RATE_LIMIT_EXCEEDED");
    }

    @Test
    @DisplayName("Extracts client IP from X-Forwarded-For header when behind a proxy")
    void usesClientIpFromProxyHeader() throws ServletException, IOException {
        String proxyIp = "203.0.113.195";

        // Exhaust quota for proxyIp
        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.addHeader("X-Forwarded-For", proxyIp + ", 10.0.0.1");
            filter.doFilter(req, new MockHttpServletResponse(), new MockFilterChain());
        }

        // 3rd request from same proxy IP must be blocked
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.addHeader("X-Forwarded-For", proxyIp + ", 10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    @DisplayName("Bypasses rate limiting for non-sensitive public endpoints")
    void bypassesNonSensitiveEndpoints() throws ServletException, IOException {
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/campaigns");
            req.setRemoteAddr("1.2.3.4");
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertThat(res.getStatus()).isEqualTo(200);
            assertThat(chain.getRequest()).isNotNull();
        }
    }
}
