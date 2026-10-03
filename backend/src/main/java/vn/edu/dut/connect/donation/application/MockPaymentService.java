package vn.edu.dut.connect.donation.application;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;

@Service
@Profile("dev & !prod")
public class MockPaymentService {
    private final DonationReadService reads;
    private final PaymentService payments;
    private final MockPaymentPort mock;

    public MockPaymentService(DonationReadService reads, PaymentService payments, MockPaymentPort mock) {
        this.reads = reads;
        this.payments = payments;
        this.mock = mock;
    }

    public PaymentDto checkout(UUID id, UUID actor) {
        var p = reads.payment(id, actor);
        if (!p.provider().equals("mock"))
            throw new ApplicationFailure(409, "INVALID_STATE_TRANSITION", "This is not a mock payment");
        return p;
    }

    public DonationDto simulateSuccess(UUID id, UUID actor) {
        return simulate(id, actor, PaymentGateway.Outcome.PAID);
    }

    public DonationDto simulateFailure(UUID id, UUID actor) {
        return simulate(id, actor, PaymentGateway.Outcome.FAILED);
    }

    private DonationDto simulate(UUID id, UUID actor, PaymentGateway.Outcome outcome) {
        checkout(id, actor);
        payments.callback("mock", mock.simulate(id, outcome));
        return reads.detail(reads.donationForPayment(id, actor), actor);
    }
}
