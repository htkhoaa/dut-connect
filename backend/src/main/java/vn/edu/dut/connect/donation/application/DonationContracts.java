package vn.edu.dut.connect.donation.application;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import vn.edu.dut.connect.donation.domain.*;

public final class DonationContracts {
    private DonationContracts() {
    }

    public record CreateRequest(@NotNull BigDecimal amount) {
    }

    public record PaymentDto(UUID id, UUID donationId, String amount, String provider, PaymentStatus status,
                             String checkoutUrl, String providerOrderId,
                             String providerTransactionId, String failureReason, Instant expiresAt, Instant paidAt,
                             Long version) {
    }

    public record DonationDto(UUID id, UUID campaignId, String campaignTitle, String campaignSlug, String amount,
                              DonationStatus status, Instant createdAt, Instant updatedAt, Long version,
                              List<PaymentDto> payments) {
    }

    public record CreationDto(UUID donationId, UUID paymentTransactionId, DonationStatus status, String checkoutUrl,
                              String message) {
    }

    public record SettingsDto(String provider, String minimumVnd, String maximumVnd, boolean available) {
    }
}
