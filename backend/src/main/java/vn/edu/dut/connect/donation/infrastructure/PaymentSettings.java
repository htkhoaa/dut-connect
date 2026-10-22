package vn.edu.dut.connect.donation.infrastructure;

import java.math.BigDecimal;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.donation.domain.Donation;

@Component
public class PaymentSettings implements vn.edu.dut.connect.donation.application.DonationPolicy {
    private final Environment env;
    private final BigDecimal minimum, maximum;
    private final String provider;

    public PaymentSettings(Environment env) {
        this.env = env;
        provider = env.getProperty("payment.provider", "mock");
        if (!java.util.Set.of("mock", "zalopay").contains(provider))
            throw new IllegalStateException("PAYMENT_PROVIDER must be mock or zalopay");
        minimum = Donation.integerAmount(new BigDecimal(env.getProperty("app.donation.min-vnd", "10000")));
        maximum = Donation.integerAmount(new BigDecimal(env.getProperty("app.donation.max-vnd", "100000000")));
        if (maximum.compareTo(minimum) < 0 || maximum.compareTo(BigDecimal.valueOf(Long.MAX_VALUE)) > 0)
            throw new IllegalStateException("Donation limits must be ordered and fit provider integer amounts");
    }

    public String provider() {
        return provider;
    }

    public BigDecimal minimum() {
        return minimum;
    }

    public BigDecimal maximum() {
        return maximum;
    }

    public String zalopay(String key) {
        return env.getProperty("payment.zalopay." + key, "").trim();
    }
}
