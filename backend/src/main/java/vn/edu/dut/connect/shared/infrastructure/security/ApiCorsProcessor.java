package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;
import jakarta.servlet.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.cors.*;

/** CORS rejection follows the same envelope as other security failures. */
public class ApiCorsProcessor extends DefaultCorsProcessor {
    private final SecurityErrorWriter errors;

    public ApiCorsProcessor(SecurityErrorWriter errors) {
        this.errors = errors;
    }

    @Override
    protected void rejectRequest(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.FORBIDDEN);
    }

    @Override
    public boolean processRequest(CorsConfiguration config, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        boolean accepted = super.processRequest(config, request, response);
        if (!accepted) errors.write(request, response, 403, "ACCESS_DENIED", "CORS request denied");
        return accepted;
    }
}
