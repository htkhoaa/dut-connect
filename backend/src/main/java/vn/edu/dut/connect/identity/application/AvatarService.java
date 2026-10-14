package vn.edu.dut.connect.identity.application;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class AvatarService {
    private final UserRepository users;
    private final AvatarRepository avatars;
    private final AvatarProcessor processor;
    public AvatarService(UserRepository users, AvatarRepository avatars, AvatarProcessor processor) {
        this.users = users; this.avatars = avatars; this.processor = processor;
    }
    @Transactional(readOnly = true)
    public Optional<byte[]> get(UUID userId) {
        IdentityAccess.requireActive(users.findUser(userId).orElseThrow(() -> ApplicationFailure.missing("User not found")));
        return avatars.find(userId);
    }
    @Transactional
    public IdentityContracts.UserSummary update(UUID userId, byte[] bytes, long version) {
        var user = users.lockUser(userId).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        RegistrationRules.version(user.version(), version);
        avatars.save(userId, processor.jpeg(bytes));
        user.rename(user.fullName());
        return IdentityContracts.UserSummary.from(users.saveUser(user));
    }
    @Transactional
    public IdentityContracts.UserSummary delete(UUID userId, long version) {
        var user = users.lockUser(userId).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        RegistrationRules.version(user.version(), version);
        avatars.delete(userId); user.rename(user.fullName());
        return IdentityContracts.UserSummary.from(users.saveUser(user));
    }
}
