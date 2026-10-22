package vn.edu.dut.connect.donation.application;

import java.util.*;

import vn.edu.dut.connect.donation.domain.*;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

public interface PaymentRepository {
    Donation saveDonation(Donation donation);

    PaymentTransaction savePayment(PaymentTransaction payment);

    Optional<Donation> donation(UUID id);

    Optional<Donation> lockDonation(UUID id);

    Optional<PaymentTransaction> payment(UUID id);

    Optional<UUID> paymentDonation(UUID id);

    Optional<PaymentTransaction> lockPayment(UUID id);

    Optional<UUID> paymentByOrder(String provider, String order);

    List<PaymentTransaction> payments(Set<UUID> donations);

    PageResult<Donation> mine(UUID user, Pagination pagination);
}
