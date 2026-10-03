package vn.edu.dut.connect.identity.infrastructure.bootstrap;

import org.springframework.boot.*;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import jakarta.validation.Validator;
import jakarta.validation.constraints.*;
import vn.edu.dut.connect.identity.application.AdminBootstrapService;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {
    private record BootstrapInput(@NotBlank @Size(max = 32) String studentId,
                                  @NotBlank @Size(max = 150) String fullName,
                                  @NotBlank @Email @Size(max = 255) String email,
                                  @NotBlank @Size(min = 8, max = 72) String password) {
    }

    private final AdminBootstrapService service;
    private final Validator validator;
    private final boolean enabled;
    private final String email, id, name, password;

    public AdminBootstrapRunner(AdminBootstrapService service, Validator validator,
                                @Value("${app.bootstrap-admin.enabled}") boolean enabled, @Value("${app.bootstrap-admin.email}") String email,
                                @Value("${app.bootstrap-admin.student-id}") String id, @Value("${app.bootstrap-admin.full-name}") String name,
                                @Value("${app.bootstrap-admin.password}") String password) {
        this.service = service;
        this.validator = validator;
        this.enabled = enabled;
        this.email = email;
        this.id = id;
        this.name = name;
        this.password = password;
    }

    public void run(ApplicationArguments args) {
        if (!enabled) return;
        if (!validator.validate(new BootstrapInput(id.trim(), name.trim(), email.trim(), password)).isEmpty())
            throw new IllegalStateException("Enabled admin bootstrap requires valid email, student ID, full name and password");
        service.create(email, id, name, password);
    }
}
