package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface PaymentGateway {
    enum Outcome {PENDING, PAID, FAILED, CANCELLED, UNKNOWN}

    record CreationCommand(UUID donationId, UUID paymentId, String orderId, BigDecimal amount, Instant createdAt,
                           Instant expiresAt) {
    }

    record CreationResult(Outcome outcome, String checkoutUrl, String code, String message) {
    }

    record Callback(String data, String mac, Integer type) {
    }

    record VerifiedResult(String provider, String orderId, Outcome outcome, BigDecimal amount, String transactionId,
                          Instant paidAt, String code) {
    }

    String provider();

    void requireAvailable();

    CreationResult createPayment(CreationCommand command);

    VerifiedResult verifyCallback(Callback callback);

    VerifiedResult query(String orderId);
}
