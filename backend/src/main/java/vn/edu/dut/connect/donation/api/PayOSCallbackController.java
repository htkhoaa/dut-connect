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

    @PostMapping(value = "/api/v1/payments/payos/webhook", consumes = "application/json", produces = "application/json")
    public java.util.Map<String, Object> receive(@RequestBody String body) {
        var ack = service.receivePayOS(body);
        return java.util.Map.of(
            "error", 0,
            "message", ack.return_message(),
            "return_code", 0,
            "return_message", ack.return_message()
        );
    }
}
