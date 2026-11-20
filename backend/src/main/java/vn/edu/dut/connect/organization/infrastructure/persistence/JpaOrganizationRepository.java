package vn.edu.dut.connect.organization.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.organization.domain.Organization;

interface JpaOrganizationRepository extends JpaRepository<Organization, UUID> {
    boolean existsBySlug(String slug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Organization o where o.id=:id")
    Optional<Organization> lockById(UUID id);
}
