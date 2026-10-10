package vn.edu.dut.connect.shared.api;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed"),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid request value"),
    MISSING_PARAMETER(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Required request parameter missing"),
    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication required"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Permission denied"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Resource not found"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Request method not supported"),
    NOT_ACCEPTABLE(HttpStatus.NOT_ACCEPTABLE, "NOT_ACCEPTABLE", "Requested response format is unavailable"),
    CONFLICT(HttpStatus.CONFLICT, "CONFLICT", "A unique value already exists"),
    DUPLICATE_APPLICATION(HttpStatus.CONFLICT, "DUPLICATE_APPLICATION", "You already have an application for this campaign"),
    OPTIMISTIC_LOCK_CONFLICT(HttpStatus.CONFLICT, "OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "Use a supported request content type"),
    RATE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unable to process request"),
    PAYMENT_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Payment provider error"),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", "Database temporarily unavailable");

    private final HttpStatus status;
    private final String code;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String code, String defaultMessage) {
        this.status = status;
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() { return status; }
    public int statusCode() { return status.value(); }
    public String code() { return code; }
    public String defaultMessage() { return defaultMessage; }
}
