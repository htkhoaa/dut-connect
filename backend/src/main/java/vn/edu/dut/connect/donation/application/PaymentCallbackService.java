package vn.edu.dut.connect.donation.application;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import vn.edu.dut.connect.donation.domain.PaymentViolation;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class PaymentCallbackService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentCallbackService.class);
    public record Acknowledgment(int return_code, String return_message) {
    }

    private final PaymentService payments;
    private final ObjectMapper json;

    public PaymentCallbackService(PaymentService payments, ObjectMapper json) {
        this.payments = payments;
        this.json = json;
    }

    public Acknowledgment receive(String body) {
        if (body == null || body.length() > 65536) return invalid();
        try {
            var callback = json.readValue(body, PaymentGateway.Callback.class);
            payments.callback("zalopay", callback);
            return new Acknowledgment(1, "Success");
        } catch (com.fasterxml.jackson.core.JsonProcessingException | PaymentViolation |
                 DataIntegrityViolationException e) {
            log.warn("Payment callback rejected failureType={}", e.getClass().getSimpleName());
            return invalid();
        } catch (ApplicationFailure e) {
            log.warn("Payment callback unavailable or rejected code={} status={}", e.code(), e.status());
            return e.status() >= 500 ? new Acknowledgment(0, "Temporarily unavailable") : invalid();
        } catch (org.springframework.dao.TransientDataAccessException |
                 org.springframework.transaction.CannotCreateTransactionException e) {
            log.warn("Payment callback temporarily unavailable failureType={}", e.getClass().getSimpleName());
            return new Acknowledgment(0, "Temporarily unavailable");
        }
    }

    private static Acknowledgment invalid() {
        return new Acknowledgment(2, "Invalid");
    }
}
