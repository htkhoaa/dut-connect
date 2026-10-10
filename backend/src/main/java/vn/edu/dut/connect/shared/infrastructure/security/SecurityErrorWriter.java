package vn.edu.dut.connect.shared.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.shared.api.ApiError;
import vn.edu.dut.connect.shared.api.ErrorCode;

@Component
public class SecurityErrorWriter {
    private final ObjectMapper mapper;

    public SecurityErrorWriter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void write(HttpServletRequest request, HttpServletResponse response, ErrorCode errorCode) throws IOException {
        write(request, response, errorCode.statusCode(), errorCode.code(), errorCode.defaultMessage());
    }

    public void write(HttpServletRequest request, HttpServletResponse response, ErrorCode errorCode, String message) throws IOException {
        write(request, response, errorCode.statusCode(), errorCode.code(), message);
    }

    public void write(HttpServletRequest request, HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), ApiError.of(request, status, code, message, List.of()));
    }
}
