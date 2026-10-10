package vn.edu.dut.connect.shared.api;

import java.sql.SQLException;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    private ApiExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new ApiExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/test");
        request.setAttribute("requestId", "trace-abc-123");
    }

    @Test
    @DisplayName("Maps ApplicationFailure directly to its status code and error code")
    void handlesApplicationFailure() {
        ApplicationFailure ex = new ApplicationFailure(403, "ACCESS_DENIED", "You cannot perform this action");

        ResponseEntity<ApiError> response = handler.application(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("ACCESS_DENIED");
        assertThat(response.getBody().message()).isEqualTo("You cannot perform this action");
        assertThat(response.getBody().requestId()).isEqualTo("trace-abc-123");
        assertThat(response.getBody().path()).isEqualTo("/api/v1/test");
    }

    @Test
    @DisplayName("Maps OptimisticLockingFailureException to 409 OPTIMISTIC_LOCK_CONFLICT")
    void handlesOptimisticLocking() {
        OptimisticLockingFailureException ex = new OptimisticLockingFailureException("Stale row");

        ResponseEntity<ApiError> response = handler.version(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("OPTIMISTIC_LOCK_CONFLICT");
        assertThat(response.getBody().message()).contains("Reload and try again");
    }

    @Test
    @DisplayName("Maps duplicate unique constraint violation (SQLState 23505) to 409 CONFLICT without leaking SQL details")
    void handlesUniqueConstraintViolation() {
        SQLException sqlEx = new SQLException("duplicate key value violates unique constraint \"uk_users_email\"", "23505");
        DataIntegrityViolationException ex = new DataIntegrityViolationException("Integrity error", sqlEx);

        ResponseEntity<ApiError> response = handler.integrity(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("CONFLICT");
        assertThat(response.getBody().message()).doesNotContain("uk_users_email");
        assertThat(response.getBody().message()).isEqualTo("A unique value already exists");
    }

    @Test
    @DisplayName("Maps database connection/transaction failure to 503 SERVICE_UNAVAILABLE")
    void handlesDatabaseUnavailable() {
        CannotCreateTransactionException ex = new CannotCreateTransactionException("Connection refused");

        ResponseEntity<ApiError> response = handler.unavailable(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("SERVICE_UNAVAILABLE");
        assertThat(response.getBody().message()).isEqualTo("Database temporarily unavailable");
    }

    @Test
    @DisplayName("Maps NoResourceFoundException to 404 RESOURCE_NOT_FOUND")
    void handlesResourceNotFound() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/api/v1/missing");

        ResponseEntity<ApiError> response = handler.notFound(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("RESOURCE_NOT_FOUND");
    }

    @Test
    @DisplayName("Maps HttpRequestMethodNotSupportedException to 405 METHOD_NOT_ALLOWED")
    void handlesMethodNotAllowed() {
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("DELETE");

        ResponseEntity<ApiError> response = handler.method(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(405);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("METHOD_NOT_ALLOWED");
    }

    @Test
    @DisplayName("Maps MissingServletRequestParameterException to 400 VALIDATION_ERROR")
    void handlesMissingParameter() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("page", "int");

        ResponseEntity<ApiError> response = handler.parameter(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("VALIDATION_ERROR");
    }

    @Test
    @DisplayName("Maps HttpMediaTypeNotSupportedException to 415 UNSUPPORTED_MEDIA_TYPE")
    void handlesUnsupportedMediaType() {
        HttpMediaTypeNotSupportedException ex = new HttpMediaTypeNotSupportedException(
                MediaType.TEXT_PLAIN, List.of(MediaType.APPLICATION_JSON));

        ResponseEntity<ApiError> response = handler.unsupportedMedia(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(415);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("UNSUPPORTED_MEDIA_TYPE");
    }

    @Test
    @DisplayName("Maps HttpMediaTypeNotAcceptableException to 406 NOT_ACCEPTABLE")
    void handlesNotAcceptable() {
        HttpMediaTypeNotAcceptableException ex = new HttpMediaTypeNotAcceptableException("Not acceptable");

        ResponseEntity<ApiError> response = handler.unacceptableMedia(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(406);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("NOT_ACCEPTABLE");
    }

    @Test
    @DisplayName("Sanitizes unexpected RuntimeException to 500 INTERNAL_ERROR without leaking stack trace")
    void handlesUnexpectedInternalError() {
        RuntimeException ex = new NullPointerException("Secret database connection string leaked here");

        ResponseEntity<ApiError> response = handler.unexpected(ex, request);

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().message()).isEqualTo("Unable to process request");
        assertThat(response.getBody().message()).doesNotContain("database", "NullPointerException");
    }
}
