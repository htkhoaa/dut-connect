package vn.edu.dut.connect.identity.application;

import java.util.*;

import vn.edu.dut.connect.identity.domain.StudentProfile;

public interface ProfileRepository {
    Optional<StudentProfile> findProfile(UUID id);

    Optional<StudentProfile> lockProfile(UUID id);

    StudentProfile saveProfile(StudentProfile profile);
}
