package vn.edu.dut.connect.shared.infrastructure.web;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String id = request.getHeader("X-Request-Id");
        try {
            id = UUID.fromString(id == null ? "" : id).toString();
        } catch (IllegalArgumentException e) {
            id = UUID.randomUUID().toString();
        }
        request.setAttribute("requestId", id);
        response.setHeader("X-Request-Id", id);
        MDC.put("requestId", id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("requestId");
        }
    }
}
