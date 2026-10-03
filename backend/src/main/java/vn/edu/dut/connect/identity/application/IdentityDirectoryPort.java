package vn.edu.dut.connect.identity.application;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.Set;
/** Small identity boundary; callers never receive persistence entities or credential fields. */
public interface IdentityDirectoryPort {
    record Account(UUID id, String studentId, String fullName, boolean active, boolean admin) {
    }
    Optional<Account> findAccount(UUID id);
    Optional<Account> lockAccount(UUID id);
    Optional<Account> findStudent(String studentId);
    Map<UUID, Account> findAccounts(Set<UUID> ids);
}
