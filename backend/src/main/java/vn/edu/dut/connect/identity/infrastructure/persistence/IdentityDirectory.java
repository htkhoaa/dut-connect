package vn.edu.dut.connect.identity.infrastructure.persistence;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
@Repository
public class IdentityDirectory implements IdentityDirectoryPort {
    private final JdbcClient jdbc;
    public IdentityDirectory(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }
    public Optional<Account> findAccount(UUID id) {
        return lookup("id", id);
    }
    public Optional<Account> lockAccount(UUID id) {
        return jdbc.sql("select id,student_id,full_name,status='ACTIVE' as active,global_role='ADMIN' as admin from dut_connect.users where id=:id for share")
                .param("id", id).query(Account.class).optional();
    }
    public Optional<Account> findStudent(String studentId) {
        return lookup("student_id", studentId);
    }
    public Map<UUID, Account> findAccounts(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return jdbc.sql("select id,student_id,full_name,status='ACTIVE' as active,global_role='ADMIN' as admin from dut_connect.users where id in (:ids)")
                .param("ids", ids).query(Account.class).list().stream().collect(Collectors.toMap(Account::id, Function.identity()));
    }
    private Optional<Account> lookup(String column, Object value) {
        return jdbc.sql("select id,student_id,full_name,status='ACTIVE' as active,global_role='ADMIN' as admin from dut_connect.users where " + column + "=:value")
        .param("value", value).query(Account.class).optional();
    }
}
