package vn.edu.dut.connect.identity.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdentitySettingsTest {

    private static final String VALID_SECRET = "01234567890123456789012345678901"; // 32 bytes
    private static final String VALID_ORIGINS = "http://localhost:5173, http://localhost";

    @Test
    @DisplayName("Successfully initializes with valid infrastructure configuration")
    void initializesWithValidSettings() {
        MockEnvironment env = new MockEnvironment();
        IdentitySettings settings = new IdentitySettings(VALID_SECRET, 15, 7, VALID_ORIGINS, env);

        assertThat(settings.secret()).hasSize(32);
        assertThat(settings.accessSeconds()).isEqualTo(15 * 60);
        assertThat(settings.refreshSeconds()).isEqualTo(7 * 86400);
        assertThat(settings.origins()).containsExactly("http://localhost:5173", "http://localhost");
        assertThat(settings.secure()).isFalse();
    }

    @Test
    @DisplayName("Enables secure cookie mode when prod profile is active")
    void enablesSecureModeOnProductionProfile() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        IdentitySettings settings = new IdentitySettings(VALID_SECRET, 15, 7, VALID_ORIGINS, env);

        assertThat(settings.secure()).isTrue();
    }

    @ParameterizedTest(name = "Invalid secret: {0}")
    @ValueSource(strings = {
            "",
            "too-short",
            "replace-with-a-very-long-placeholder-string-here-that-has-over-32-bytes"
    })
    @DisplayName("Rejects secrets with less than 32 bytes or example placeholder tokens")
    void rejectsInvalidSecrets(String invalidSecret) {
        MockEnvironment env = new MockEnvironment();
        assertThatThrownBy(() -> new IdentitySettings(invalidSecret, 15, 7, VALID_ORIGINS, env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    @Test
    @DisplayName("Rejects token lifetimes less than 1")
    void rejectsInvalidTtl() {
        MockEnvironment env = new MockEnvironment();
        assertThatThrownBy(() -> new IdentitySettings(VALID_SECRET, 0, 7, VALID_ORIGINS, env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid token lifetimes");

        assertThatThrownBy(() -> new IdentitySettings(VALID_SECRET, 15, 0, VALID_ORIGINS, env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid token lifetimes");
    }

    @ParameterizedTest(name = "Invalid origins: {0}")
    @ValueSource(strings = {
            "",
            "   ",
            "ftp://invalid-protocol.com",
            "invalid-no-protocol"
    })
    @DisplayName("Rejects missing or invalid HTTP/HTTPS allowed origins")
    void rejectsInvalidOrigins(String invalidOrigins) {
        MockEnvironment env = new MockEnvironment();
        assertThatThrownBy(() -> new IdentitySettings(VALID_SECRET, 15, 7, invalidOrigins, env))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_ALLOWED_ORIGINS");
    }
}
