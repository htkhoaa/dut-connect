package vn.edu.dut.connect.donation.api;

import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.donation.application.*;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.api.PageResponse;

import static vn.edu.dut.connect.donation.application.DonationContracts.*;

@RestController
@RequestMapping("/api/v1")
public class DonationController {
    private final PaymentService payments;
    private final DonationReadService reads;

    public DonationController(PaymentService payments, DonationReadService reads) {
        this.payments = payments;
        this.reads = reads;
    }

    @GetMapping("/donation-settings")
    public SettingsDto settings() {
        return payments.settings();
    }

    @PostMapping("/campaigns/{id}/donations")
    public ResponseEntity<CreationDto> create(@PathVariable UUID id, Authentication a, @Valid @RequestBody CreateRequest r) {
        var result = payments.create(id, UUID.fromString(a.getName()), r.amount());
        return ResponseEntity.created(java.net.URI.create("/api/v1/donations/" + result.donationId())).body(result);
    }

    @GetMapping("/donations/{id}")
    public DonationDto detail(@PathVariable UUID id, Authentication a) {
        return reads.detail(id, UUID.fromString(a.getName()));
    }

    @GetMapping("/me/donations")
    public PageResponse<DonationDto> mine(Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(reads.mine(UUID.fromString(a.getName()), new Pagination(page, size)));
    }

    @PostMapping("/payments/{id}/refresh")
    public DonationDto refresh(@PathVariable UUID id, Authentication a) {
        return payments.refresh(id, UUID.fromString(a.getName()));
    }
}
