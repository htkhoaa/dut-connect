package vn.edu.dut.connect.donation.infrastructure.persistence;

import java.util.*;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.donation.domain.Donation;

interface JpaDonationRepository extends JpaRepository<Donation, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Donation d where d.id=:id")
    Optional<Donation> lock(UUID id);
}
