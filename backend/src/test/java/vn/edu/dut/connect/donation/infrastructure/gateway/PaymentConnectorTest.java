package vn.edu.dut.connect.donation.infrastructure.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import vn.edu.dut.connect.donation.infrastructure.PaymentSettings;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentConnectorTest {

    @Test
    @DisplayName("Generates deterministic 64-char HMAC-SHA256 signature")
    void generatesValidHmacSha256Signature() {
        String data = "app_id=2553&app_trans_id=261010_123456&amount=50000";
        String key = "test_mac_key_1";

        String signature = PaymentMac.sign(data, key);

        assertThat(signature).isNotNull();
        assertThat(signature).hasSize(64);
        assertThat(signature).matches("^[0-9a-f]{64}$");

        // Verify valid signature verification
        assertThat(PaymentMac.valid(data, signature, key)).isTrue();
    }

    @Test
    @DisplayName("Rejects tampered payload or invalid signature")
    void rejectsTamperedPayload() {
        String data = "app_id=2553&app_trans_id=261010_123456&amount=50000";
        String tampered = "app_id=2553&app_trans_id=261010_123456&amount=500000";
        String key = "test_mac_key_1";

        String signature = PaymentMac.sign(data, key);

        assertThat(PaymentMac.valid(tampered, signature, key)).isFalse();
        assertThat(PaymentMac.valid(data, signature, "wrong_key")).isFalse();
        assertThat(PaymentMac.valid(data, "invalid_hex", key)).isFalse();
        assertThat(PaymentMac.valid(null, signature, key)).isFalse();
        assertThat(PaymentMac.valid(data, null, key)).isFalse();
    }

    @Test
    @DisplayName("ZaloPay Sandbox Connector validates mandatory merchant credentials and endpoints")
    void validatesZaloPaySandboxConfiguration() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("payment.provider", "zalopay");
        PaymentSettings settings = new PaymentSettings(env);
        ZaloPaySandboxPaymentGateway gateway = new ZaloPaySandboxPaymentGateway(settings, new ObjectMapper());

        // Fails with 503 when credentials are not configured
        assertThatThrownBy(gateway::requireAvailable)
                .isInstanceOf(ApplicationFailure.class)
                .hasMessageContaining("ZaloPay");
    }

    @Test
    @DisplayName("ZaloPay Sandbox Connector accepts valid sandbox configuration")
    void acceptsValidSandboxConfiguration() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("payment.provider", "zalopay");
        env.setProperty("payment.zalopay.app-id", "2554");
        env.setProperty("payment.zalopay.key1", "sample_key_1");
        env.setProperty("payment.zalopay.key2", "sample_key_2");
        env.setProperty("payment.zalopay.create-order-url", "https://sb-openapi.zalopay.vn/v2/create");
        env.setProperty("payment.zalopay.query-order-url", "https://sb-openapi.zalopay.vn/v2/query");
        env.setProperty("payment.zalopay.callback-url", "https://api.dutconnect.edu.vn/api/v1/payments/zalopay/callback");
        env.setProperty("payment.zalopay.redirect-url", "https://dutconnect.edu.vn/payment/result");

        PaymentSettings settings = new PaymentSettings(env);
        ZaloPaySandboxPaymentGateway gateway = new ZaloPaySandboxPaymentGateway(settings, new ObjectMapper());

        assertThat(gateway.provider()).isEqualTo("zalopay");
        gateway.requireAvailable(); // Does not throw
    }
}
