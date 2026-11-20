package vn.edu.dut.connect.identity.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.identity.domain.StudentProfile;

interface JpaProfileRepository extends JpaRepository<StudentProfile, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from StudentProfile p where p.userId = :id")
    Optional<StudentProfile> lockById(UUID id);
}
