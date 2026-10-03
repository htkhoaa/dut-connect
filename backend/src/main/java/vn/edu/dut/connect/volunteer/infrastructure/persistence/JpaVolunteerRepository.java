package vn.edu.dut.connect.volunteer.infrastructure.persistence;
import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.volunteer.domain.VolunteerRegistration;
interface JpaVolunteerRepository extends JpaRepository<VolunteerRegistration,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from VolunteerRegistration v where v.id=:id")
    Optional<VolunteerRegistration> lockById(UUID id);
    boolean existsByCampaignIdAndUserId(UUID campaignId,UUID userId);
}
