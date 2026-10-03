package vn.edu.dut.connect.ai.infrastructure;

import java.net.URI;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class AiSettings {
    private static final int DEFAULT_MAX_APPLICANTS = 20;
    private final Environment environment;
    public AiSettings(Environment environment) { this.environment = environment; }
    public boolean enabled() { return Boolean.parseBoolean(environment.getProperty("ai.enabled", "false").trim()); }
    public String model() { return environment.getProperty("ai.model", "").trim(); }
    public String key() { return environment.getProperty("ai.api-key", "").trim(); }
    public int maxApplicants() {
        int limit = configuredLimit();
        return limit > 0 ? limit : DEFAULT_MAX_APPLICANTS;
    }
    private int configuredLimit() {
        try {
            int limit = Integer.parseInt(environment.getProperty("ai.max-applicants", "20").trim());
            return limit >= 1 && limit <= DEFAULT_MAX_APPLICANTS ? limit : -1;
        } catch (NumberFormatException e) { return -1; }
    }
    public URI endpoint() {
        try {
            String base = environment.getProperty("ai.base-url", "").trim().replaceAll("/+$", "");
            var uri = URI.create(base);
            boolean devHttp = environment.acceptsProfiles(Profiles.of("dev")) && "http".equals(uri.getScheme());
            if ((!"https".equals(uri.getScheme()) && !devHttp) || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null || uri.getPort() == 0 || uri.getPort() > 65535)
                throw new IllegalArgumentException();
            return URI.create(base + "/chat/completions");
        } catch (IllegalArgumentException e) { throw unavailable(); }
    }
    public void requireAvailable() {
        if (!enabled() || configuredLimit() < 1 || key().isBlank() || model().isBlank() || key().chars().anyMatch(c -> c < 32 || c > 126)) throw unavailable();
        endpoint();
    }
    public static ApplicationFailure unavailable() {
        return new ApplicationFailure(503, "AI_PROVIDER_UNAVAILABLE", "AI matching is disabled or unavailable. Manual application review remains available.");
    }
}
