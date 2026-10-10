package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityErrorWriterTest {

    private ObjectMapper objectMapper;
    private SecurityErrorWriter securityErrorWriter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        securityErrorWriter = new SecurityErrorWriter(objectMapper);
    }

    @Test
    @DisplayName("Writes standardized JSON error response with correct status code and headers")
    void writesStandardizedErrorResponse() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/protected-resource");
        request.setAttribute("requestId", "req-12345");

        MockHttpServletResponse response = new MockHttpServletResponse();

        securityErrorWriter.write(request, response, 403, "ACCESS_DENIED", "Access forbidden");

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/json");

        String content = response.getContentAsString();
        JsonNode json = objectMapper.readTree(content);

        assertThat(json.get("status").asInt()).isEqualTo(403);
        assertThat(json.get("code").asText()).isEqualTo("ACCESS_DENIED");
        assertThat(json.get("message").asText()).isEqualTo("Access forbidden");
        assertThat(json.get("requestId").asText()).isEqualTo("req-12345");
    }

    @Test
    @DisplayName("Writes standardized JSON error response using ErrorCode enum")
    void writesErrorResponseUsingErrorCode() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/auth/login");
        request.setAttribute("requestId", "req-login-123");

        MockHttpServletResponse response = new MockHttpServletResponse();

        securityErrorWriter.write(request, response, vn.edu.dut.connect.shared.api.ErrorCode.AUTHENTICATION_REQUIRED);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertThat(json.get("status").asInt()).isEqualTo(401);
        assertThat(json.get("code").asText()).isEqualTo("AUTHENTICATION_REQUIRED");
        assertThat(json.get("message").asText()).isEqualTo("Authentication required");
        assertThat(json.get("requestId").asText()).isEqualTo("req-login-123");
    }

    @Test
    @DisplayName("Writes standardized JSON error response using ErrorCode and custom message")
    void writesErrorResponseUsingErrorCodeAndCustomMessage() throws IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/auth/login");

        MockHttpServletResponse response = new MockHttpServletResponse();

        securityErrorWriter.write(request, response, vn.edu.dut.connect.shared.api.ErrorCode.ACCESS_DENIED, "Custom forbidden message");

        assertThat(response.getStatus()).isEqualTo(403);

        JsonNode json = objectMapper.readTree(response.getContentAsString());
        assertThat(json.get("status").asInt()).isEqualTo(403);
        assertThat(json.get("code").asText()).isEqualTo("ACCESS_DENIED");
        assertThat(json.get("message").asText()).isEqualTo("Custom forbidden message");
    }
}
