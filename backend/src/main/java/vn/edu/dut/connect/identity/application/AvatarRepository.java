package vn.edu.dut.connect.identity.application;
import java.util.Optional;
import java.util.UUID;
public interface AvatarRepository {
    Optional<byte[]> find(UUID userId);
    void save(UUID userId, byte[] jpeg);
    void delete(UUID userId);
}
