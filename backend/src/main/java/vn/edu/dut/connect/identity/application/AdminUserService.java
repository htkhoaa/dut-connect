package vn.edu.dut.connect.identity.application;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@Service
public class AdminUserService {
    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);
    private final UserRepository users;
    private final RefreshTokenRepository tokens;

    public AdminUserService(UserRepository users, RefreshTokenRepository tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    @Transactional(readOnly = true)
    public PageResult<UserSummary> list(UUID actor, int page, int size) {
        IdentityAccess.requireAdmin(users.findUser(actor).orElseThrow(() -> ApplicationFailure.missing("User not found")));
        return users.listUsers(new Pagination(page, size)).map(UserSummary::from);
    }

    @Transactional
    public UserSummary status(UUID actor, UUID id, StatusRequest request) {
        // Stable lock ordering also covers administrators changing one another's status.
        UUID first = actor.compareTo(id) <= 0 ? actor : id;
        UUID second = first.equals(actor) ? id : actor;
        User firstUser = users.lockUser(first).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        User secondUser = first.equals(second) ? firstUser : users.lockUser(second)
                .orElseThrow(() -> ApplicationFailure.missing("User not found"));
        User administrator = first.equals(actor) ? firstUser : secondUser;
        User user = first.equals(id) ? firstUser : secondUser;
        IdentityAccess.requireAdmin(administrator);
        RegistrationRules.version(user.version(), request.version());
        user.changeStatus(request.status());
        if (request.status() == AccountStatus.SUSPENDED) tokens.revokeUserTokens(id, Instant.now());
        users.saveUser(user);
        log.info("Account status changed actor={} user={} status={}", actor, id, request.status());
        return UserSummary.from(user);
    }
}
