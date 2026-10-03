package vn.edu.dut.connect.shared.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Component;
import vn.edu.dut.connect.shared.api.ApiError;

@Component
public class SecurityErrorWriter {
    private final ObjectMapper mapper;

    public SecurityErrorWriter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void write(HttpServletRequest request, HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        mapper.writeValue(response.getOutputStream(), ApiError.of(request, status, code, message, List.of()));
    }
}
