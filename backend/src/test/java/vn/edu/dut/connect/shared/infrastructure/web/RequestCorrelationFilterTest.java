package vn.edu.dut.connect.shared.infrastructure.web;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequestCorrelationFilterTest {

    private RequestCorrelationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RequestCorrelationFilter();
        MDC.clear();
    }

    @Test
    @DisplayName("Preserves valid incoming X-Request-Id UUID header")
    void preservesValidIncomingRequestId() throws ServletException, IOException {
        String existingId = UUID.randomUUID().toString();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", existingId);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcDuringFilter = new AtomicReference<>();
        FilterChain chain = (req, res) -> mdcDuringFilter.set(MDC.get("requestId"));

        filter.doFilter(request, response, chain);

        assertThat(request.getAttribute("requestId")).isEqualTo(existingId);
        assertThat(response.getHeader("X-Request-Id")).isEqualTo(existingId);
        assertThat(mdcDuringFilter.get()).isEqualTo(existingId);
        // Ensure MDC is cleaned up after filter execution
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    @DisplayName("Generates new random UUID when X-Request-Id is missing")
    void generatesNewIdWhenHeaderIsMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        String generatedId = (String) request.getAttribute("requestId");
        assertThat(generatedId).isNotNull();
        // Verifies the generated string is a valid UUID
        assertThat(UUID.fromString(generatedId)).isNotNull();
        assertThat(response.getHeader("X-Request-Id")).isEqualTo(generatedId);
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    @DisplayName("Replaces malformed X-Request-Id header with a newly generated UUID")
    void replacesMalformedHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Request-Id", "not-a-valid-uuid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        String generatedId = (String) request.getAttribute("requestId");
        assertThat(generatedId).isNotNull().isNotEqualTo("not-a-valid-uuid");
        assertThat(UUID.fromString(generatedId)).isNotNull();
        assertThat(response.getHeader("X-Request-Id")).isEqualTo(generatedId);
    }

    @Test
    @DisplayName("Always cleans up MDC even if filter chain throws an unhandled exception")
    void cleansUpMdcOnException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain throwingChain = (req, res) -> {
            throw new RuntimeException("Downstream error");
        };

        assertThatThrownBy(() -> filter.doFilter(request, response, throwingChain))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Downstream error");

        assertThat(MDC.get("requestId")).isNull();
    }
}
