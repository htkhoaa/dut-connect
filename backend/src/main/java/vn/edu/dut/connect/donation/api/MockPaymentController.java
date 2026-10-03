package vn.edu.dut.connect.donation.api;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.donation.application.MockPaymentService;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;

@RestController
@Profile("dev & !prod")
@RequestMapping("/api/v1/dev/mock-payments")
public class MockPaymentController {
    private final MockPaymentService service;

    public MockPaymentController(MockPaymentService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public PaymentDto checkout(@PathVariable UUID id, Authentication a) {
        return service.checkout(id, UUID.fromString(a.getName()));
    }

    @PostMapping("/{id}/success")
    public DonationDto success(@PathVariable UUID id, Authentication a) {
        return service.simulateSuccess(id, UUID.fromString(a.getName()));
    }

    @PostMapping("/{id}/fail")
    public DonationDto failure(@PathVariable UUID id, Authentication a) {
        return service.simulateFailure(id, UUID.fromString(a.getName()));
    }
}
