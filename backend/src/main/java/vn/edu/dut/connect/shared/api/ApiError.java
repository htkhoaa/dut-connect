package vn.edu.dut.connect.shared.api;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

public record ApiError(Instant timestamp, int status, String code, String message, String path,
                       String requestId, List<FieldError> fieldErrors) {
    public record FieldError(String field, String message) {
    }

    public static ApiError of(HttpServletRequest request, int status, String code, String message, List<FieldError> fields) {
        return new ApiError(Instant.now(), status, code, message, request.getRequestURI(),
                (String) request.getAttribute("requestId"), fields);
    }
}
