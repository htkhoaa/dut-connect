package vn.edu.dut.connect.donation.application;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Service;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;
import static vn.edu.dut.connect.donation.application.PaymentGateway.*;

@Service
public class PaymentService {
    private final PaymentGateways gateways;
    private final PaymentTransactions transactions;
    private final DonationReadService reads;
    private final DonationPolicy policy;

    public PaymentService(PaymentGateways gateways, PaymentTransactions transactions, DonationReadService reads, DonationPolicy policy) {
        this.gateways = gateways;
        this.transactions = transactions;
        this.reads = reads;
        this.policy = policy;
    }

    public CreationDto create(UUID campaign, UUID actor, BigDecimal amount) {
        var gateway = gateways.selected();
        var command = transactions.prepare(campaign, actor, amount, gateway.provider());
        var result = gateway.createPayment(command);
        transactions.finalizeCreation(command.paymentId(), result);
        var d = reads.detail(command.donationId(), actor);
        var p = d.payments().stream().filter(v -> v.id().equals(command.paymentId())).findFirst().orElseThrow();
        // A callback may settle the intent before the create-order response arrives.
        return new CreationDto(d.id(), p.id(), d.status(), p.checkoutUrl(), p.failureReason());
    }

    public DonationDto refresh(UUID id, UUID actor) {
        var p = reads.payment(id, actor);
        if (p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.CREATED || p.status() == vn.edu.dut.connect.donation.domain.PaymentStatus.PROVIDER_PENDING)
            transactions.settle(gateways.get(p.provider()).query(p.providerOrderId()));
        return reads.detail(reads.donationForPayment(id, actor), actor);
    }

    public void callback(String provider, Callback callback) {
        transactions.settle(gateways.get(provider).verifyCallback(callback));
    }

    public SettingsDto settings() {
        boolean available;
        try {
            gateways.selected();
            available = true;
        } catch (vn.edu.dut.connect.shared.application.ApplicationFailure e) {
            available = false;
        }
        return new SettingsDto(policy.provider(), policy.minimum().toPlainString(), policy.maximum().toPlainString(), available);
    }
}
