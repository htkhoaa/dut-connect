package vn.edu.dut.connect.campaign.application;

import java.util.List;
import java.util.UUID;

public class CampaignThankYouContracts {

    public record SendThankYouRequest(
        @jakarta.validation.constraints.Size(max = 200) String customSubject,
        @jakarta.validation.constraints.Size(max = 5000) String customMessage,
        @jakarta.validation.constraints.Size(max = 500) List<String> recipientKeys
    ) {}

    public record ThankYouRecipientDto(
        UUID userId,
        String fullName,
        String studentId,
        String email,
        String contributionType, // "DONATION" or "VOLUNTEER"
        String detail, // e.g. "500.000 đ" or "30 giờ"
        boolean emailSent,
        String errorCode
    ) {
        public ThankYouRecipientDto(
            UUID userId,
            String fullName,
            String studentId,
            String email,
            String contributionType,
            String detail,
            boolean emailSent
        ) {
            this(userId, fullName, studentId, email, contributionType, detail, emailSent, null);
        }
    }

    public record CampaignRecipientsSummary(
        UUID campaignId,
        String campaignTitle,
        String contributionMode,
        int donorsCount,
        int volunteersCount,
        List<ThankYouRecipientDto> donors,
        List<ThankYouRecipientDto> volunteers
    ) {}

    public record CampaignThankYouResponse(
        int donorsCount,
        int volunteersCount,
        int totalSent,
        String message,
        List<ThankYouRecipientDto> recipients
    ) {}
}
