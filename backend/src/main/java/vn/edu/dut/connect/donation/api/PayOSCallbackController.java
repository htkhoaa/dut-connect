package vn.edu.dut.connect.donation.api;

import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.donation.application.PaymentCallbackService;

@RestController
public class PayOSCallbackController {
    private final PaymentCallbackService service;

    public PayOSCallbackController(PaymentCallbackService service) {
        this.service = service;
    }

    @PostMapping(value = "/api/v1/payments/payos/webhook", consumes = "application/json", produces = "application/json")
    public PaymentCallbackService.Acknowledgment receive(@RequestBody String body) {
        return service.receivePayOS(body);
    }
}
