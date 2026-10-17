package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.campaign.domain.CampaignCategory;
interface JpaCategoryRepository extends JpaRepository<CampaignCategory,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from CampaignCategory e where e.id=:id")
    Optional<CampaignCategory> lockById(UUID id);
    boolean existsBySlug(String slug);

}
