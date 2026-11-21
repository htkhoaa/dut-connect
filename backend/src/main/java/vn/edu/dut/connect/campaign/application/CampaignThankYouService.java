package vn.edu.dut.connect.campaign.application;

import static vn.edu.dut.connect.campaign.application.CampaignThankYouContracts.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.ContributionMode;
import vn.edu.dut.connect.notification.application.NotificationService;

@Service
public class CampaignThankYouService {

    private static final Logger log = LoggerFactory.getLogger(CampaignThankYouService.class);

    private final CampaignThankYouRepository repository;
    private final CampaignAuthorization access;
    private final CampaignAccessPort campaigns;
    private final CampaignMailDelivery emailService;
    private final NotificationService notificationService;
    private final DutCertificateGenerator certificateGenerator;

    public CampaignThankYouService(
        CampaignThankYouRepository repository,
        CampaignAuthorization access,
        CampaignAccessPort campaigns,
        CampaignMailDelivery emailService,
        NotificationService notificationService,
        DutCertificateGenerator certificateGenerator
    ) {
        this.repository = repository;
        this.access = access;
        this.campaigns = campaigns;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.certificateGenerator = certificateGenerator;
    }

    @Transactional(readOnly = true)
    public CampaignRecipientsSummary recipientsSummary(UUID campaignId, UUID actorId) {
        access.manager(campaignId, actorId);
        var campaign = campaigns.getCampaign(campaignId);

        List<ThankYouRecipientDto> donors = getDonors(campaignId);
        List<ThankYouRecipientDto> volunteers = getVolunteers(campaignId);

        return new CampaignRecipientsSummary(
            campaignId,
            campaign.title(),
            campaign.contributionMode().name(),
            donors.size(),
            volunteers.size(),
            donors,
            volunteers
        );
    }

    public CampaignThankYouResponse sendThankYou(
        UUID campaignId,
        UUID actorId,
        SendThankYouRequest request
    ) {
        access.manager(campaignId, actorId);
        var campaign = campaigns.getCampaign(campaignId);
        if (
            campaign.status() != vn.edu.dut.connect.campaign.domain.CampaignStatus.COMPLETED
        ) throw new vn.edu.dut.connect.shared.application.ApplicationFailure(
            409,
            "INVALID_STATE_TRANSITION",
            "Complete the campaign before sending certificates"
        );
        if (
            !emailService.available()
        ) throw new vn.edu.dut.connect.shared.application.ApplicationFailure(
            503,
            "MAIL_UNAVAILABLE",
            "Email delivery is not configured"
        );
        String campaignTitle = campaign.title();
        ContributionMode mode = campaign.contributionMode();

        String todayStr = LocalDate.now().format(
            DateTimeFormatter.ofPattern("'ngày' dd 'tháng' MM 'năm' yyyy")
        );

        List<ThankYouRecipientDto> sentRecipients = new ArrayList<>();
        int donorsCount = 0;
        int volunteersCount = 0;

        // Recipient emails always come from paid donations or verified volunteer records.
        // A retry supplies keys, never arbitrary recipient addresses.
        List<ThankYouRecipientDto> recipients = new ArrayList<>();
        if (mode != ContributionMode.VOLUNTEER_ONLY) recipients.addAll(getDonors(campaignId));
        if (mode != ContributionMode.DONATION_ONLY) recipients.addAll(getVolunteers(campaignId));
        for (var recipient : recipients) {
            String key = recipient.contributionType() + ":" + recipient.userId();
            if (
                request != null &&
                request.recipientKeys() != null &&
                !request.recipientKeys().contains(key)
            ) continue;
            boolean donor = "DONATION".equals(recipient.contributionType());
            String detail = recipient.detail();
            // Claim each recipient once, including concurrent clicks and repeated requests.
            if (!repository.claimDelivery(campaignId, recipient)) {
                String state = repository.deliveryStatus(campaignId, recipient);
                boolean sent = "SENT".equals(state);
                sentRecipients.add(
                    new ThankYouRecipientDto(
                        recipient.userId(),
                        recipient.fullName(),
                        recipient.studentId(),
                        recipient.email(),
                        recipient.contributionType(),
                        detail,
                        sent,
                        sent ? null : "MAIL_IN_PROGRESS"
                    )
                );
                if (sent) {
                    if (donor) donorsCount++;
                    else volunteersCount++;
                }
                continue;
            }
            var certData = new DutCertificateGenerator.CertificateData(
                generateCode(donor ? "DON" : "VOL", campaignId, recipient.userId()),
                recipient.fullName(),
                recipient.studentId(),
                campaignTitle,
                donor
                    ? DutCertificateGenerator.CertificateData.ContributionType.DONATION
                    : DutCertificateGenerator.CertificateData.ContributionType.VOLUNTEER,
                detail,
                todayStr
            );
            boolean imageCreated = false;
            try {
                byte[] pngBytes = certificateGenerator.generatePng(certData);
                imageCreated = true;
                String subject =
                    request != null &&
                    request.customSubject() != null &&
                    !request.customSubject().isBlank()
                        ? request.customSubject().strip()
                        : "[DUT Connect] Thư cảm ơn đóng góp chiến dịch: " + campaignTitle;
                String message = request != null ? request.customMessage() : null;
                String html = donor
                    ? CampaignThankYouEmailTemplate.buildDonationEmailHtml(
                          recipient.fullName(),
                          recipient.studentId(),
                          campaignTitle,
                          detail.replace(" đ", ""),
                          message
                      )
                    : CampaignThankYouEmailTemplate.buildVolunteerEmailHtml(
                          recipient.fullName(),
                          recipient.studentId(),
                          campaignTitle,
                          detail,
                          message
                      );
                emailService.send(
                    actorId,
                    recipient.email(),
                    subject,
                    html,
                    "Giay_Chung_Nhan_DUT_" + recipient.studentId() + ".png",
                    pngBytes,
                    "image/png"
                );
            } catch (Exception ex) {
                String code =
                    ex instanceof vn.edu.dut.connect.shared.application.ApplicationFailure failure
                        ? failure.code()
                        : imageCreated
                          ? "MAIL_DELIVERY_FAILED"
                          : "CERTIFICATE_GENERATION_FAILED";
                log.error(
                    "Thank-you delivery failed campaign={} user={} code={} cause={}",
                    campaignId,
                    recipient.userId(),
                    code,
                    ex.getClass().getSimpleName()
                );
                repository.markFailed(campaignId, recipient, code);
                sentRecipients.add(
                    new ThankYouRecipientDto(
                        recipient.userId(),
                        recipient.fullName(),
                        recipient.studentId(),
                        recipient.email(),
                        recipient.contributionType(),
                        detail,
                        false,
                        code
                    )
                );
                continue;
            }
            // An in-app notification failure must not turn an accepted email into a failed delivery.
            try {
                repository.markSent(campaignId, recipient);
            } catch (Exception ex) {
                // Keep SENDING when the provider accepted the message but recording failed; do not resend blindly.
                log.error(
                    "Email accepted but delivery record could not be updated campaign={} user={}",
                    campaignId,
                    recipient.userId()
                );
            }
            sentRecipients.add(
                new ThankYouRecipientDto(
                    recipient.userId(),
                    recipient.fullName(),
                    recipient.studentId(),
                    recipient.email(),
                    recipient.contributionType(),
                    detail,
                    true
                )
            );
            if (donor) donorsCount++;
            else volunteersCount++;
            try {
                notificationService.notifyUser(
                    recipient.userId(),
                    "CAMPAIGN_THANK_YOU",
                    "Thư cảm ơn đóng góp: " + campaignTitle,
                    "Ban Tổ chức đã gửi thư cảm ơn và chứng nhận đến email của bạn. Vui lòng kiểm tra hộp thư và thư rác.",
                    "CAMPAIGN",
                    campaignId
                );
            } catch (Exception ex) {
                log.warn(
                    "Thank-you email accepted but notification failed campaign={} user={}",
                    campaignId,
                    recipient.userId()
                );
            }
        }

        int totalSent = donorsCount + volunteersCount;
        log.info(
            "Sent thank-you emails for campaignId={} totalSent={} donors={} volunteers={}",
            campaignId,
            totalSent,
            donorsCount,
            volunteersCount
        );

        int failed = sentRecipients.size() - totalSent;
        String summaryMessage = sentRecipients.isEmpty()
            ? "Không có người nhận đủ điều kiện."
            : totalSent == 0
              ? "Chưa gửi được thư nào. Vui lòng kiểm tra lỗi gửi email trước khi thử lại."
              : "Dịch vụ email đã tiếp nhận " +
                totalSent +
                " thư cảm ơn; " +
                failed +
                " thư chưa gửi được.";

        return new CampaignThankYouResponse(
            donorsCount,
            volunteersCount,
            totalSent,
            summaryMessage,
            sentRecipients
        );
    }

    @Transactional(readOnly = true)
    public String previewCertificateSvg(UUID campaignId, String type) {
        var campaign = campaigns.getCampaign(campaignId);
        if (
            campaign.status() == vn.edu.dut.connect.campaign.domain.CampaignStatus.DRAFT
        ) throw vn.edu.dut.connect.shared.application.ApplicationFailure.missing(
            "Campaign not found"
        );
        boolean isVolunteer = "VOLUNTEER".equalsIgnoreCase(type);
        String todayStr = LocalDate.now().format(
            DateTimeFormatter.ofPattern("'ngày' dd 'tháng' MM 'năm' yyyy")
        );

        var certData = new DutCertificateGenerator.CertificateData(
            "DUT-SAMPLE-2026",
            "NGUYỄN VĂN AN",
            "102210001",
            campaign.title(),
            isVolunteer
                ? DutCertificateGenerator.CertificateData.ContributionType.VOLUNTEER
                : DutCertificateGenerator.CertificateData.ContributionType.DONATION,
            isVolunteer ? "30 GIỜ TÌNH NGUYỆN" : "500.000",
            todayStr
        );

        return certificateGenerator.generateSvg(certData);
    }

    @Transactional(readOnly = true)
    public String previewCertificateSvg(UUID campaignId, UUID actorId, String type) {
        return previewCertificateSvg(campaignId, type);
    }

    private List<ThankYouRecipientDto> getDonors(UUID campaignId) {
        return repository
            .donors(campaignId)
            .stream()
            .map(d ->
                new ThankYouRecipientDto(
                    d.userId(),
                    d.fullName(),
                    d.studentId(),
                    d.email(),
                    "DONATION",
                    String.format(
                        java.util.Locale.ROOT,
                        "%,d",
                        d.totalAmount().toBigIntegerExact()
                    ).replace(',', '.') + " đ",
                    false
                )
            )
            .toList();
    }

    private List<ThankYouRecipientDto> getVolunteers(UUID campaignId) {
        return repository
            .volunteers(campaignId)
            .stream()
            .map(v ->
                new ThankYouRecipientDto(
                    v.userId(),
                    v.fullName(),
                    v.studentId(),
                    v.email(),
                    "VOLUNTEER",
                    v.verifiedHours().compareTo(BigDecimal.ZERO) > 0
                        ? v.verifiedHours().stripTrailingZeros().toPlainString() + " giờ"
                        : "Tham gia",
                    false
                )
            )
            .toList();
    }

    private String generateCode(String prefix, UUID campaignId, UUID userId) {
        int hash = Math.abs(Objects.hash(campaignId, userId, 2026));
        return prefix + "-" + String.format("%04X", hash % 0xFFFF);
    }
}
