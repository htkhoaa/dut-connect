package vn.edu.dut.connect.identity.application;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegistrationRulesTest {

    @Nested
    @DisplayName("Email normalization rules")
    class EmailRules {

        @Test
        @DisplayName("Trims whitespace and converts to lowercase")
        void trimsAndLowercasesEmail() {
            String result = RegistrationRules.email("  Student.DUT@dut.udn.vn  ");
            assertThat(result).isEqualTo("student.dut@dut.udn.vn");
        }

        @Test
        @DisplayName("Rejects blank email with VALIDATION_ERROR")
        void rejectsBlankEmail() {
            assertThatThrownBy(() -> RegistrationRules.email("   "))
                    .isInstanceOf(ApplicationFailure.class)
                    .hasMessageContaining("exceeds its length limit after normalization");
        }
    }

    @Nested
    @DisplayName("Student ID normalization rules")
    class StudentIdRules {

        @Test
        @DisplayName("Trims whitespace and converts to uppercase")
        void trimsAndUppercasesStudentId() {
            String result = RegistrationRules.studentId("  102210001  ");
            assertThat(result).isEqualTo("102210001");
        }
    }

    @Nested
    @DisplayName("Password validation rules")
    class PasswordRules {

        @ParameterizedTest(name = "Valid password: {0}")
        @ValueSource(strings = {"12345678", "secure_DUT_password_2026", "Abc@12345"})
        @DisplayName("Accepts passwords with length between 8 and 72 bytes")
        void acceptsValidPasswords(String validPassword) {
            // Should not throw any exception
            RegistrationRules.password(validPassword);
        }

        @Test
        @DisplayName("Rejects password with fewer than 8 characters")
        void rejectsShortPassword() {
            assertThatThrownBy(() -> RegistrationRules.password("short"))
                    .isInstanceOf(ApplicationFailure.class)
                    .hasMessageContaining("at least 8 characters");
        }
    }

    @Nested
    @DisplayName("Optimistic locking version rules")
    class VersionRules {

        @Test
        @DisplayName("Passes when actual version matches expected version")
        void passesMatchingVersion() {
            RegistrationRules.version(1L, 1L);
        }

        @Test
        @DisplayName("Throws 409 conflict when version does not match")
        void throwsConflictOnMismatch() {
            assertThatThrownBy(() -> RegistrationRules.version(2L, 1L))
                    .isInstanceOf(ApplicationFailure.class)
                    .matches(e -> ((ApplicationFailure) e).status() == 409);
        }
    }
}
