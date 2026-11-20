package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.ProfileRepository;
import vn.edu.dut.connect.identity.domain.StudentProfile;

@Repository
public class ProfilePersistence implements ProfileRepository {

    private final JpaProfileRepository profiles;

    public ProfilePersistence(JpaProfileRepository profiles) {
        this.profiles = profiles;
    }

    public Optional<StudentProfile> findProfile(UUID id) {
        return profiles.findById(id);
    }

    public Optional<StudentProfile> lockProfile(UUID id) {
        return profiles.lockById(id);
    }

    public StudentProfile saveProfile(StudentProfile profile) {
        return profiles.saveAndFlush(profile);
    }
}
