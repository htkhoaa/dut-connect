package vn.edu.dut.connect.donation.api;

import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.donation.application.PaymentCallbackService;

@RestController
public class PayOSCallbackController {

    private final PaymentCallbackService service;

    public PayOSCallbackController(PaymentCallbackService service) {
        this.service = service;
    }

    @GetMapping(value = "/api/v1/payments/payos/webhook")
    public java.util.Map<String, Object> check() {
        return java.util.Map.of("status", "ok", "message", "PayOS Webhook is active");
    }

    @PostMapping(
        value = "/api/v1/payments/payos/webhook",
        consumes = "application/json",
        produces = "application/json"
    )
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> receive(
        @RequestBody String body
    ) {
        var ack = service.receivePayOS(body);
        int status = ack.return_code() == 0 ? 200 : ack.return_code() == 1 ? 503 : 400;
        return org.springframework.http.ResponseEntity.status(status).body(
            java.util.Map.of(
                "error",
                ack.return_code(),
                "message",
                ack.return_message(),
                "return_code",
                ack.return_code(),
                "return_message",
                ack.return_message()
            )
        );
    }
}
