package vn.edu.dut.connect.campaign.infrastructure.persistence;
import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.campaign.domain.Proposal;
interface JpaProposalRepository extends JpaRepository<Proposal,UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Proposal e where e.id=:id")
    Optional<Proposal> lockById(UUID id);
    
    
}
