package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Aggregate read boundary: no donor identity or payment attempts leave this module. */
public interface DonationFundingPort {
    record Funding(BigDecimal amount, long count) {}
    Map<UUID, Funding> paidFunding(Set<UUID> campaigns);
}
