package vn.edu.dut.connect.donation.application;

import java.util.UUID;

public interface MockPaymentPort {
    PaymentGateway.Callback simulate(UUID payment, PaymentGateway.Outcome outcome);
}
