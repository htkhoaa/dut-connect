package vn.edu.dut.connect.shared.api;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> uploadSize(org.springframework.web.multipart.MaxUploadSizeExceededException e, HttpServletRequest r) {
        return error(r, 400, "VALIDATION_ERROR", "Avatar must not exceed 1 MB", List.of());
    }
    @ExceptionHandler(org.springframework.web.multipart.support.MissingServletRequestPartException.class)
    ResponseEntity<ApiError> uploadPart(org.springframework.web.multipart.support.MissingServletRequestPartException e, HttpServletRequest r) {
        return error(r, 400, "VALIDATION_ERROR", "Avatar image is required", List.of());
    }
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);


    @ExceptionHandler(vn.edu.dut.connect.volunteer.domain.VolunteerViolation.class)
    ResponseEntity<ApiError> volunteer(vn.edu.dut.connect.volunteer.domain.VolunteerViolation e, HttpServletRequest r) {
        var fields=e.field()==null?List.<ApiError.FieldError>of():List.of(new ApiError.FieldError(e.field(),e.getMessage()));
        return error(r,"VALIDATION_ERROR".equals(e.code())?400:409,e.code(),e.getMessage(),fields);
    }

    @ExceptionHandler(vn.edu.dut.connect.campaign.domain.CampaignViolation.class)
    ResponseEntity<ApiError> campaign(vn.edu.dut.connect.campaign.domain.CampaignViolation e, HttpServletRequest r) {
        var fields = e.field() == null ? List.<ApiError.FieldError>of() : List.of(new ApiError.FieldError(e.field(), e.getMessage()));
        return error(r, "VALIDATION_ERROR".equals(e.code()) ? 400 : 409, e.code(), e.getMessage(), fields);
    }

    @ExceptionHandler(vn.edu.dut.connect.organization.domain.OrganizationRuleViolation.class)
    ResponseEntity<ApiError> organization(vn.edu.dut.connect.organization.domain.OrganizationRuleViolation e,HttpServletRequest r) {
        return error(r,409,e.code(),e.getMessage(),List.of());
    }

    @ExceptionHandler(ApplicationFailure.class)
    ResponseEntity<ApiError> application(ApplicationFailure e, HttpServletRequest r) {
        return error(r, e.status(), e.code(), e.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException e, HttpServletRequest r) {
        return error(r, 400, "VALIDATION_ERROR", "Request validation failed", e.getBindingResult().getFieldErrors().stream()
                .map(x -> new ApiError.FieldError(x.getField(), x.getDefaultMessage())).toList());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiError> malformed(RuntimeException e, HttpServletRequest r) {
        return error(r, 400, "VALIDATION_ERROR", "Invalid request value", List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> integrity(DataIntegrityViolationException e, HttpServletRequest r) {
        for (Throwable cause = e; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                if (sql.getMessage()!=null && sql.getMessage().contains("\"uk_volunteer_campaign_user\""))
                    return error(r,409,"DUPLICATE_APPLICATION","You already have an application for this campaign",List.of());
                return error(r, 409, "CONFLICT", "A unique value already exists", List.of());
            }
        }
        log.error("Unexpected data integrity failure: type={}", e.getClass().getSimpleName());
        return error(r, 500, "INTERNAL_ERROR", "Unable to process request", List.of());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ApiError> version(OptimisticLockingFailureException e, HttpServletRequest r) {
        return error(r, 409, "OPTIMISTIC_LOCK_CONFLICT", "This record changed. Reload and try again.", List.of());
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, CannotCreateTransactionException.class})
    ResponseEntity<ApiError> unavailable(RuntimeException e, HttpServletRequest r) {
        return error(r, 503, "SERVICE_UNAVAILABLE", "Database temporarily unavailable", List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> notFound(NoResourceFoundException e, HttpServletRequest r) {
        return error(r, 404, "RESOURCE_NOT_FOUND", "Resource not found", List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> method(HttpRequestMethodNotSupportedException e, HttpServletRequest r) {
        return error(r, 405, "METHOD_NOT_ALLOWED", "Request method not supported", List.of());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiError> parameter(MissingServletRequestParameterException e, HttpServletRequest r) {
        return error(r, 400, "VALIDATION_ERROR", "Required request parameter missing", List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> unsupportedMedia(HttpMediaTypeNotSupportedException e, HttpServletRequest r) {
        return error(r, 415, "UNSUPPORTED_MEDIA_TYPE", "Use a supported request content type", List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    ResponseEntity<ApiError> unacceptableMedia(HttpMediaTypeNotAcceptableException e, HttpServletRequest r) {
        return error(r, 406, "NOT_ACCEPTABLE", "Requested response format is unavailable", List.of());
    }

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<ApiError> unexpected(RuntimeException e, HttpServletRequest r) {
        log.error("Unhandled request failure: type={}", e.getClass().getSimpleName());
        return error(r, 500, "INTERNAL_ERROR", "Unable to process request", List.of());
    }

    private ResponseEntity<ApiError> error(HttpServletRequest r, int status, String code, String message, List<ApiError.FieldError> fields) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
                .body(ApiError.of(r, status, code, message, fields));
    }
}
