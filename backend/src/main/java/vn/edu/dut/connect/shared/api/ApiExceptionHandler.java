package vn.edu.dut.connect.shared.api;

import java.sql.SQLException;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import vn.edu.dut.connect.campaign.domain.CampaignViolation;
import vn.edu.dut.connect.donation.domain.PaymentViolation;
import vn.edu.dut.connect.finance.domain.ExpenseViolation;
import vn.edu.dut.connect.organization.domain.OrganizationRuleViolation;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.volunteer.domain.VolunteerViolation;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApplicationFailure.class)
    public ResponseEntity<ApiError> application(ApplicationFailure e, HttpServletRequest r) {
        return error(r, e.status(), e.code(), e.getMessage(), List.of());
    }

    @ExceptionHandler(CampaignViolation.class)
    public ResponseEntity<ApiError> campaign(CampaignViolation e, HttpServletRequest r) {
        return domainViolation(r, e.code(), e.getMessage(), e.field());
    }

    @ExceptionHandler(ExpenseViolation.class)
    public ResponseEntity<ApiError> expense(ExpenseViolation e, HttpServletRequest r) {
        return domainViolation(r, e.code(), e.getMessage(), e.field());
    }

    @ExceptionHandler(VolunteerViolation.class)
    public ResponseEntity<ApiError> volunteer(VolunteerViolation e, HttpServletRequest r) {
        return domainViolation(r, e.code(), e.getMessage(), e.field());
    }

    @ExceptionHandler(PaymentViolation.class)
    public ResponseEntity<ApiError> payment(PaymentViolation e, HttpServletRequest r) {
        int status = ("VALIDATION_ERROR".equals(e.code()) || "PAYMENT_VERIFICATION_FAILED".equals(e.code())) ? 400
                : ("PAYMENT_PROVIDER_ERROR".equals(e.code()) ? 502 : 409);
        return domainViolation(r, status, e.code(), e.getMessage(), e.field());
    }

    @ExceptionHandler(OrganizationRuleViolation.class)
    public ResponseEntity<ApiError> organization(OrganizationRuleViolation e, HttpServletRequest r) {
        return error(r, 409, e.code(), e.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e, HttpServletRequest r) {
        List<ApiError.FieldError> fields = e.getBindingResult().getFieldErrors().stream()
                .map(err -> new ApiError.FieldError(err.getField(), err.getDefaultMessage()))
                .toList();
        return error(r, ErrorCode.VALIDATION_ERROR.statusCode(), ErrorCode.VALIDATION_ERROR.code(),
                ErrorCode.VALIDATION_ERROR.defaultMessage(), fields);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> malformed(RuntimeException e, HttpServletRequest r) {
        return error(r, ErrorCode.MALFORMED_REQUEST);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> parameter(MissingServletRequestParameterException e, HttpServletRequest r) {
        return error(r, ErrorCode.MISSING_PARAMETER);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> notFound(NoResourceFoundException e, HttpServletRequest r) {
        return error(r, ErrorCode.RESOURCE_NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> method(HttpRequestMethodNotSupportedException e, HttpServletRequest r) {
        return error(r, ErrorCode.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> unsupportedMedia(HttpMediaTypeNotSupportedException e, HttpServletRequest r) {
        return error(r, ErrorCode.UNSUPPORTED_MEDIA_TYPE);
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    public ResponseEntity<ApiError> unacceptableMedia(HttpMediaTypeNotAcceptableException e, HttpServletRequest r) {
        return error(r, ErrorCode.NOT_ACCEPTABLE);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> version(OptimisticLockingFailureException e, HttpServletRequest r) {
        return error(r, ErrorCode.OPTIMISTIC_LOCK_CONFLICT);
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, CannotCreateTransactionException.class})
    public ResponseEntity<ApiError> unavailable(RuntimeException e, HttpServletRequest r) {
        return error(r, ErrorCode.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integrity(DataIntegrityViolationException e, HttpServletRequest r) {
        for (Throwable current = e.getCause(); current != null; current = current.getCause()) {
            if (current instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                if (sql.getMessage() != null && sql.getMessage().contains("\"uk_volunteer_campaign_user\"")) {
                    return error(r, ErrorCode.DUPLICATE_APPLICATION);
                }
                return error(r, ErrorCode.CONFLICT);
            }
        }
        log.error("Unexpected data integrity failure: path={}, ex={}", r.getRequestURI(), e.getMessage(), e);
        return error(r, ErrorCode.INTERNAL_ERROR);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> unexpected(RuntimeException e, HttpServletRequest r) {
        log.error("Unhandled request failure: path={}, ex={}", r.getRequestURI(), e.getMessage(), e);
        return error(r, ErrorCode.INTERNAL_ERROR);
    }

    private ResponseEntity<ApiError> domainViolation(HttpServletRequest r, String code, String message, String field) {
        int status = "VALIDATION_ERROR".equals(code) ? 400 : 409;
        return domainViolation(r, status, code, message, field);
    }

    private ResponseEntity<ApiError> domainViolation(HttpServletRequest r, int status, String code, String message, String field) {
        List<ApiError.FieldError> fields = (field != null && !field.isBlank())
                ? List.of(new ApiError.FieldError(field, message)) : List.of();
        return error(r, status, code, message, fields);
    }

    private ResponseEntity<ApiError> error(HttpServletRequest r, ErrorCode errorCode) {
        return error(r, errorCode.statusCode(), errorCode.code(), errorCode.defaultMessage(), List.of());
    }

    private ResponseEntity<ApiError> error(HttpServletRequest r, int status, String code, String message, List<ApiError.FieldError> fields) {
        if (status >= 500) {
            log.error("System error [code={}, path={}, method={}]: {}", code, r.getRequestURI(), r.getMethod(), message);
        } else if (log.isWarnEnabled()) {
            log.warn("Client error [status={}, code={}, path={}, method={}]: {}", status, code, r.getRequestURI(), r.getMethod(), message);
        }
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(ApiError.of(r, status, code, message, fields));
    }
}
