package vn.edu.dut.connect.campaign.api;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.campaign.application.CampaignAuthorization;
import vn.edu.dut.connect.campaign.application.CampaignRepository;
import vn.edu.dut.connect.campaign.domain.Campaign;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.campaign.domain.ContributionMode;
import vn.edu.dut.connect.donation.application.DonationFundingPort;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.organization.application.OrganizationAccessPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class AdminCampaignPayoutController {

    private final CampaignRepository campaigns;
    private final CampaignAuthorization access;
    private final DonationFundingPort donations;
    private final IdentityDirectoryPort identities;
    private final OrganizationAccessPort organizations;

    public AdminCampaignPayoutController(CampaignRepository campaigns,
                                        CampaignAuthorization access,
                                        DonationFundingPort donations,
                                        IdentityDirectoryPort identities,
                                        OrganizationAccessPort organizations) {
        this.campaigns = campaigns;
        this.access = access;
        this.donations = donations;
        this.identities = identities;
        this.organizations = organizations;
    }

    public record PayoutCampaignDto(
            UUID id,
            String slug,
            String title,
            String organizerName,
            String primaryContactName,
            String donationBankName,
            String donationAccountNumber,
            String donationAccountHolder,
            String fundraisingGoal,
            String currentBalance,
            String campaignStatus,
            String payoutStatus,
            String payoutAmount,
            Instant payoutTransferredAt,
            String payoutNote,
            boolean hasPayoutReceipt,
            long version
    ) {}

    @GetMapping("/admin/campaign-payouts")
    @Transactional(readOnly = true)
    public List<PayoutCampaignDto> list(Authentication auth) {
        if (auth == null) throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        access.active(UUID.fromString(auth.getName()));
        if (!access.active(UUID.fromString(auth.getName())).admin()) {
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Admin permission required");
        }

        // List all campaigns from repository
        var query = new vn.edu.dut.connect.campaign.application.CampaignQuery(0, 100, "", null, null, null, null, "newest");
        var page = campaigns.list(query, null, CampaignRepository.Visibility.ALL);
        var donationCampaigns = page.items().stream()
                .filter(c -> c.content().contributionMode() != ContributionMode.VOLUNTEER_ONLY)
                .toList();

        var campaignIds = donationCampaigns.stream().map(Campaign::id).collect(Collectors.toSet());
        var balances = donations.paidFunding(campaignIds);
        var contactAccounts = identities.findAccounts(donationCampaigns.stream().map(Campaign::contactId).collect(Collectors.toSet()));
        var orgNames = organizations.names(donationCampaigns.stream().map(c -> c.content().organizationId()).filter(Objects::nonNull).collect(Collectors.toSet()));

        return donationCampaigns.stream().map(c -> {
            var funding = balances.getOrDefault(c.id(), new DonationFundingPort.Funding(BigDecimal.ZERO, 0));
            var contact = contactAccounts.get(c.contactId());
            String orgName = c.content().organizationId() == null ? contact.fullName() : orgNames.get(c.content().organizationId());
            BigDecimal current = funding.amount();
            BigDecimal goal = c.content().fundraisingGoal() == null ? BigDecimal.ZERO : c.content().fundraisingGoal();

            String status = c.payoutStatus();
            if (status == null || status.isBlank()) {
                if ("PAID_OUT".equals(status)) {
                    // already set
                } else if (c.status() == CampaignStatus.COMPLETED) {
                    status = "READY_FOR_PAYOUT";
                } else if (goal.signum() > 0 && current.compareTo(goal) >= 0) {
                    status = "GOAL_REACHED";
                } else {
                    status = "PENDING_FUNDS";
                }
            }

            return new PayoutCampaignDto(
                    c.id(),
                    c.slug(),
                    c.content().title(),
                    orgName,
                    contact != null ? contact.fullName() : "",
                    c.content().donationBankName(),
                    c.content().donationAccountNumber(),
                    c.content().donationAccountHolder(),
                    goal.toPlainString(),
                    current.toPlainString(),
                    c.status().name(),
                    status,
                    c.payoutAmount() == null ? current.toPlainString() : c.payoutAmount().toPlainString(),
                    c.payoutTransferredAt(),
                    c.payoutNote(),
                    c.payoutReceiptData() != null,
                    c.version()
            );
        }).toList();
    }

    @PostMapping(value = "/admin/campaigns/{id}/payout", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Void> confirmPayout(
            @PathVariable UUID id,
            @RequestParam("amount") BigDecimal amount,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam("version") Long version,
            @RequestPart(value = "receipt", required = false) MultipartFile file,
            Authentication auth) throws IOException {
        if (auth == null) throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        access.active(UUID.fromString(auth.getName()));
        if (!access.active(UUID.fromString(auth.getName())).admin()) {
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Admin permission required");
        }

        Campaign campaign = campaigns.lock(id).orElseThrow(() -> ApplicationFailure.missing("Campaign not found"));
        campaign.requireVersion(version);

        boolean isEnded = campaign.status() == CampaignStatus.COMPLETED
                || (campaign.content().fundraisingDeadline() != null && !Instant.now().isBefore(campaign.content().fundraisingDeadline()));
        if (!isEnded) {
            throw new ApplicationFailure(400, "CAMPAIGN_NOT_ENDED", "Chỉ có thể giải ngân khi chiến dịch đã kết thúc");
        }

        byte[] receiptBytes = null;
        String contentType = null;
        if (file != null && !file.isEmpty()) {
            receiptBytes = file.getBytes();
            contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
        }

        campaign.confirmPayout(amount, receiptBytes, contentType, note);
        campaigns.save(campaign);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/campaigns/{id}/payout-receipt")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable UUID id) {
        Campaign campaign = campaigns.find(id).orElseThrow(() -> ApplicationFailure.missing("Campaign not found"));
        if (campaign.payoutReceiptData() == null || campaign.payoutReceiptData().length == 0) {
            throw ApplicationFailure.missing("No payout receipt uploaded for this campaign");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(campaign.payoutReceiptContentType() != null ? campaign.payoutReceiptContentType() : "image/jpeg"))
                .body(campaign.payoutReceiptData());
    }
}
