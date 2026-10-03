package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.campaign.domain.Campaign;
interface JpaCampaignRepository extends JpaRepository<Campaign,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Campaign e where e.id=:id")
    Optional<Campaign> lockById(UUID id);
    boolean existsBySlug(String slug);
    Optional<Campaign> findBySlug(String slug);
    Optional<Campaign> findByProposalId(UUID proposalId);
}
