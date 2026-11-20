package vn.edu.dut.connect.campaign.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import vn.edu.dut.connect.campaign.application.CampaignThankYouContracts.ThankYouRecipientDto;

public interface CampaignThankYouRepository {
    record DonorRecord(
        UUID userId,
        String studentId,
        String fullName,
        String email,
        BigDecimal totalAmount
    ) {}

    record VolunteerRecord(
        UUID userId,
        String studentId,
        String fullName,
        String email,
        BigDecimal verifiedHours
    ) {}

    List<DonorRecord> donors(UUID campaignId);
    List<VolunteerRecord> volunteers(UUID campaignId);
    boolean claimDelivery(UUID campaignId, ThankYouRecipientDto recipient);
    String deliveryStatus(UUID campaignId, ThankYouRecipientDto recipient);
    void markSent(UUID campaignId, ThankYouRecipientDto recipient);
    void markFailed(UUID campaignId, ThankYouRecipientDto recipient, String errorCode);
}
