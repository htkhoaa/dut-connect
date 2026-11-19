package vn.edu.dut.connect.donation.infrastructure.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import vn.edu.dut.connect.donation.application.PaymentGateway;
import vn.edu.dut.connect.donation.infrastructure.PaymentSettings;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PayOSPaymentGatewayTest {
    private final ObjectMapper json = new ObjectMapper();
    private final PaymentSettings settings = mock(PaymentSettings.class);
    private final PayOSPaymentGateway gateway = new PayOSPaymentGateway(settings, json);

    private ObjectNode payload() {
        when(settings.payos("checksum-key")).thenReturn("test-secret");
        var data = json.createObjectNode().put("reference", "BANK-001").put("orderCode", 123456)
                .put("currency", "VND").put("code", "00").put("amount", 20000);
        return json.createObjectNode().set("data", data);
    }

    private PaymentGateway.Callback signed(ObjectNode payload) {
        payload.put("signature", PaymentMac.sign(PayOSPaymentGateway.signatureData(payload.get("data")), "test-secret"));
        return new PaymentGateway.Callback(payload.toString(), "", 0);
    }

    @Test void sortsOnlyDataFieldsForSignature() {
        assertEquals("amount=20000&code=00&currency=VND&orderCode=123456&reference=BANK-001",
                PayOSPaymentGateway.signatureData(payload().get("data")));
    }

    @Test void acceptsSignedSuccessfulPayment() {
        // Fixed HMAC vector computed independently, so this test also catches signing regressions.
        var payload = payload().put("signature", "ce5e2700324dc80a97dad94e64caec51be67f7c3e4d8dc8136ddb9130db9eeb6");
        var result = gateway.verifyCallback(new PaymentGateway.Callback(payload.toString(), "", 0));
        assertEquals(PaymentGateway.Outcome.PAID, result.outcome());
        assertEquals("123456", result.orderId());
        assertEquals("BANK-001", result.transactionId());
    }

    @Test void rejectsUnsignedWebhook() {
        assertThrows(ApplicationFailure.class, () -> gateway.verifyCallback(new PaymentGateway.Callback(payload().toString(), "", 0)));
    }

    @Test void rejectsChangedAmountAfterSigning() {
        var payload = payload();
        signed(payload);
        ((ObjectNode) payload.get("data")).put("amount", 90000);
        assertThrows(ApplicationFailure.class, () -> gateway.verifyCallback(new PaymentGateway.Callback(payload.toString(), "", 0)));
    }

    @Test void rejectsSignedFailedPayment() {
        var payload = payload();
        ((ObjectNode) payload.get("data")).put("code", "01");
        assertThrows(ApplicationFailure.class, () -> gateway.verifyCallback(signed(payload)));
    }

    @Test void requiresRealBankReference() {
        var payload = payload();
        ((ObjectNode) payload.get("data")).put("reference", "");
        assertThrows(ApplicationFailure.class, () -> gateway.verifyCallback(signed(payload)));
    }

    @Test void missingCredentialsDisablePaymentsInsteadOfUsingAnotherBankAccount() {
        when(settings.payos(anyString())).thenReturn("");
        assertThrows(ApplicationFailure.class, gateway::requireAvailable);
    }
}
