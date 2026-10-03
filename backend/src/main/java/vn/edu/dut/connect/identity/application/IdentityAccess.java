package vn.edu.dut.connect.identity.application;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class IdentityAccess {
    private final UserRepository users;

    public IdentityAccess(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public User activeUser(UUID id) {
        User user = users.findUser(id).orElseThrow(() -> new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Account no longer available"));
        requireActive(user);
        return user;
    }

    public static void requireActive(User user) {
        if (user.status() != AccountStatus.ACTIVE)
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Account suspended");
    }

    public static void requireAdmin(User user) {
        requireActive(user);
        if (user.role() != GlobalRole.ADMIN)
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Administrator permission required");
    }
}
