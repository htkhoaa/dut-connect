package vn.edu.dut.connect.donation.infrastructure.gateway;

import java.time.Instant;
import java.util.*;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import vn.edu.dut.connect.donation.application.*;
import vn.edu.dut.connect.donation.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
@Profile("dev & !prod")
public class LocalMockPaymentGateway implements PaymentGateway, MockPaymentPort {
    private final PaymentRepository repository;
    private final ObjectMapper json;
    private final String key;

    public LocalMockPaymentGateway(PaymentRepository repository, ObjectMapper json) {
        this.repository = repository;
        this.json = json;
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        key = HexFormat.of().formatHex(bytes);
    }

    public String provider() {
        return "mock";
    }

    public void requireAvailable() {
    }

    public CreationResult createPayment(CreationCommand c) {
        return new CreationResult(Outcome.PENDING, "/dev/mock-payments/" + c.paymentId(), "MOCK_CREATED", null);
    }

    public VerifiedResult verifyCallback(Callback c) {
        if (c == null || !Integer.valueOf(1).equals(c.type()) || !PaymentMac.valid(c.data(), c.mac(), key))
            throw invalid();
        try {
            var data = json.readTree(c.data());
            if (data == null || !data.isObject()) throw invalid();
            var outcome = Outcome.valueOf(data.path("outcome").asText());
            if (!Set.of(Outcome.PAID, Outcome.FAILED).contains(outcome) || !data.path("provider").asText().equals(provider()))
                throw invalid();
            return new VerifiedResult(provider(), data.path("order").asText(), outcome, Donation.integerAmount(new java.math.BigDecimal(data.path("amount").asText())), data.path("transaction").asText(), Instant.parse(data.path("time").asText()), "MOCK_CALLBACK");
        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException e) {
            throw invalid();
        }
    }

    @Transactional(readOnly = true)
    public Callback simulate(UUID id, Outcome outcome) {
        var p = repository.payment(id).orElseThrow(() -> ApplicationFailure.missing("Payment not found"));
        if (!provider().equals(p.provider()))
            throw new ApplicationFailure(409, "INVALID_STATE_TRANSITION", "Only mock payments can be simulated");
        if (outcome == Outcome.PAID && p.status() != PaymentStatus.PAID && p.expiresAt() != null && !Instant.now().isBefore(p.expiresAt()))
            throw new ApplicationFailure(409, "INVALID_STATE_TRANSITION", "Mock checkout expired; refresh status");
        try {
            String data = json.writeValueAsString(Map.of("provider", provider(), "order", p.providerOrderId(), "amount", p.amount().toPlainString(), "outcome", outcome.name(), "transaction", "mock_" + p.id(), "time", Instant.now().toString()));
            return new Callback(data, PaymentMac.sign(data, key), 1);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Unable to construct mock provider event", e);
        }
    }

    @Transactional(readOnly = true)
    public VerifiedResult query(String order) {
        var id = repository.paymentByOrder(provider(), order).orElseThrow(() -> ApplicationFailure.missing("Payment not found"));
        var p = repository.payment(id).orElseThrow();
        Outcome outcome = switch (p.status()) {
            case PAID -> Outcome.PAID;
            case FAILED -> Outcome.FAILED;
            case CANCELLED -> Outcome.CANCELLED;
            default -> p.expiresAt() == null || Instant.now().isBefore(p.expiresAt()) ? Outcome.PENDING : Outcome.FAILED;
        };
        return new VerifiedResult(provider(), order, outcome, p.amount(), p.providerTransactionId(), p.paidAt(), "MOCK_QUERY");
    }

    private static ApplicationFailure invalid() {
        return new ApplicationFailure(400, "PAYMENT_VERIFICATION_FAILED", "Invalid mock provider event");
    }
}
