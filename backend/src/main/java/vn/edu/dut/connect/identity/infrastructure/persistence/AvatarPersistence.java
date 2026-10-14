package vn.edu.dut.connect.identity.infrastructure.persistence;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.AvatarRepository;

@Repository
public class AvatarPersistence implements AvatarRepository {
    private final JdbcClient jdbc;
    public AvatarPersistence(JdbcClient jdbc) {this.jdbc = jdbc;}
    public Optional<byte[]> find(UUID id) {
        return jdbc.sql("select image_data from dut_connect.profile_avatars where user_id=:id").param("id", id)
            .query((rs, row) -> rs.getBytes(1)).optional();
    }
    public void save(UUID id, byte[] bytes) {
        jdbc.sql("insert into dut_connect.profile_avatars(user_id,image_data,updated_at) values (:id,:image,now()) " +
            "on conflict(user_id) do update set image_data=excluded.image_data,updated_at=excluded.updated_at")
            .param("id", id).param("image", bytes).update();
    }
    public void delete(UUID id) {jdbc.sql("delete from dut_connect.profile_avatars where user_id=:id").param("id", id).update();}
}
