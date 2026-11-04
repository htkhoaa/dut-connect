package vn.edu.dut.connect.identity.application;

import org.slf4j.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class AdminBootstrapService {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapService.class);
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public AdminBootstrapService(UserRepository users, PasswordEncoder passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    @Transactional
    public void create(String email, String studentId, String name, String password, boolean resetExisting) {
        String normalizedEmail = RegistrationRules.email(email);
        var existing = users.findEmail(normalizedEmail);
        if (existing.isPresent()) {
            if (resetExisting && existing.get().role() == GlobalRole.ADMIN) {
                RegistrationRules.password(password);
                existing.get().changePassword(passwords.encode(password));
                users.saveUser(existing.get());
                log.warn("Admin bootstrap reset password for existing admin user={}", existing.get().id());
            } else {
                log.info("Admin bootstrap skipped: configured email already exists");
            }
            return;
        }
        RegistrationRules.password(password);
        if (users.studentIdExists(RegistrationRules.studentId(studentId)))
            throw ApplicationFailure.conflict("Bootstrap student ID already exists");
        User user = users.saveUser(new User(RegistrationRules.studentId(studentId), normalizedEmail, passwords.encode(password), name.trim(), GlobalRole.ADMIN));
        log.info("Admin bootstrap created user={}", user.id());
    }
}
