package vn.edu.dut.connect.donation.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.donation.domain.PaymentTransaction;

interface JpaPaymentRepository extends JpaRepository<PaymentTransaction, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentTransaction p where p.id=:id")
    Optional<PaymentTransaction> lock(UUID id);

    List<PaymentTransaction> findByDonationIdInOrderByCreatedAtDescIdAsc(Set<UUID> ids);
}
