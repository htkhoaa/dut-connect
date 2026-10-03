package vn.edu.dut.connect.donation.application;

import java.util.*;

import org.springframework.stereotype.Component;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class PaymentGateways {
    private final Map<String, PaymentGateway> gateways;
    private final DonationPolicy settings;

    public PaymentGateways(List<PaymentGateway> gateways, DonationPolicy settings) {
        this.gateways = gateways.stream().collect(java.util.stream.Collectors.toUnmodifiableMap(PaymentGateway::provider, g -> g));
        this.settings = settings;
    }

    public PaymentGateway selected() {
        var gateway = get(settings.provider());
        gateway.requireAvailable();
        return gateway;
    }

    public PaymentGateway get(String provider) {
        var gateway = gateways.get(provider);
        if (gateway == null)
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "Selected payment provider is unavailable in this profile");
        return gateway;
    }
}
