package vn.edu.dut.connect.shared.infrastructure.security;

import java.io.IOException;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.dut.connect.identity.infrastructure.security.IdentitySettings;

/**
 * Instantiated inside the security chain only, avoiding duplicate servlet registration.
 */
public class CookieOriginFilter extends OncePerRequestFilter {
    private final IdentitySettings settings;
    private final SecurityErrorWriter errors;

    public CookieOriginFilter(IdentitySettings settings, SecurityErrorWriter errors) {
        this.settings = settings;
        this.errors = errors;
    }

    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean authPost = "POST".equals(request.getMethod()) && (path.equals("/api/v1/auth/login") ||
                path.equals("/api/v1/auth/refresh") || path.equals("/api/v1/auth/logout") || path.startsWith("/api/v1/auth/google/"));
        if (authPost && !settings.origins().contains(request.getHeader("Origin"))) {
            errors.write(request, response, 403, "ACCESS_DENIED", "A configured Origin is required for cookie authentication");
            return;
        }
        chain.doFilter(request, response);
    }
}
