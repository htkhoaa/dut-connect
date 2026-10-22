package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;

public interface DonationPolicy {
    String provider();

    BigDecimal minimum();

    BigDecimal maximum();
}
