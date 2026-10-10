package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.dut.connect.shared.api.ErrorCode;

public class RateLimitingFilter extends OncePerRequestFilter {
    private final InMemoryRateLimiter rateLimiter;
    private final SecurityErrorWriter errors;

    public RateLimitingFilter(InMemoryRateLimiter rateLimiter, SecurityErrorWriter errors) {
        this.rateLimiter = rateLimiter;
        this.errors = errors;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (isRateLimitedEndpoint(request.getMethod(), path)) {
            String clientIp = resolveClientIp(request);
            if (!rateLimiter.tryAcquire(clientIp)) {
                response.setHeader("Retry-After", "60");
                errors.write(request, response, ErrorCode.RATE_LIMIT_EXCEEDED);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isRateLimitedEndpoint(String method, String path) {
        return "POST".equalsIgnoreCase(method) &&
                (path.equals("/api/v1/auth/login") ||
                 path.equals("/api/v1/auth/register") ||
                 path.equals("/api/v1/auth/refresh"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
