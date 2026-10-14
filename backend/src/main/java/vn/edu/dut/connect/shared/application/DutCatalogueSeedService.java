package vn.edu.dut.connect.shared.application;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.organization.application.OrganizationContracts;
import vn.edu.dut.connect.organization.application.OrganizationService;

/** Coordinates an explicitly simulated catalogue through normal permission/lifecycle checks. */
@Service
public class DutCatalogueSeedService {
    public record OrganizationSeed(String key, String name, String type, String description) {}
    public record CampaignSeed(String key, String organization, String category, String title, String summary,
                               String description, CampaignStatus status, int startOffset, int endOffset,
                               int deadlineOffset, int capacity) {}
    public record Catalogue(List<OrganizationSeed> organizations, List<CampaignSeed> campaigns) {}
    private static final Logger log = LoggerFactory.getLogger(DutCatalogueSeedService.class);
    private final DutCataloguePort records;
    private final OrganizationService organizations;
    private final ProposalService proposals;
    private final ProposalReviewService reviews;
    private final CampaignCommandService commands;

    public DutCatalogueSeedService(DutCataloguePort records, OrganizationService organizations,
            ProposalService proposals, ProposalReviewService reviews, CampaignCommandService commands) {
        this.records = records; this.organizations = organizations; this.proposals = proposals;
        this.reviews = reviews; this.commands = commands;
    }

    @Transactional
    public void importCatalogue(Catalogue catalogue) {
        records.lockImport();
        var administrator = records.administrator();
        if (administrator.isEmpty()) {
            log.info("DUT catalogue import postponed: an active administrator is required");
            return;
        }
        UUID actor = administrator.get();
        Map<String, UUID> units = new HashMap<>();
        int addedOrganizations = 0, addedCampaigns = 0;
        for (var seed : catalogue.organizations()) {
            var imported = records.imported(seed.key());
            UUID id;
            if (imported.isPresent()) id = imported.get();
            else {
                var existing = records.organizationNamed(seed.name());
                if (existing.isPresent()) {
                    var detail = organizations.get(existing.get(), actor);
                    if (!detail.canRepresent()) {
                        log.warn("DUT catalogue organization belongs to another representative; skipping key={}", seed.key());
                        continue;
                    }
                    id = existing.get();
                } else {
                    var detail = organizations.create(actor, new OrganizationContracts.CreateRequest(
                            seed.name(), records.organizationType(seed.type()), seed.description()));
                    id = detail.organization().id();
                    organizations.moderate(id, actor, new OrganizationContracts.VersionRequest(
                            detail.organization().version()), OrganizationService.Moderation.VERIFY);
                    addedOrganizations++;
                }
                records.recordOrganization(seed.key(), id);
            }
            units.put(seed.key(), id);
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        for (var seed : catalogue.campaigns()) {
            if (records.imported(seed.key()).isPresent() || !units.containsKey(seed.organization())) continue;
            var content = new ContentInput(OrganizerType.ORGANIZATION, units.get(seed.organization()),
                    records.category(seed.category()), seed.title(), seed.summary(), seed.description(),
                    "Mục tiêu và chỉ tiêu trong DUT Connect là mô phỏng để trải nghiệm quy trình; kết quả lịch sử xem tại nguồn gốc.",
                    ContributionMode.VOLUNTEER_ONLY, today.plusDays(seed.startOffset()), today.plusDays(seed.endOffset()),
                    today.plusDays(seed.deadlineOffset()).atTime(23, 59).toInstant(ZoneOffset.UTC), null,
                    seed.capacity(), 0, seed.capacity(),
                    "Sinh viên quan tâm hoạt động cộng đồng; tham gia buổi hướng dẫn an toàn, làm việc theo nhóm và tuân thủ phân công. Chỉ tiêu tuyển là mô phỏng.",
                    null, BigDecimal.ZERO, null, BigDecimal.ZERO, null);
            var proposal = proposals.create(actor, new CampaignContracts.CreateRequest(content));
            var campaign = reviews.approve(proposal.id(), actor, new CampaignContracts.VersionRequest(proposal.version()));
            for (CampaignStatus step : steps(seed.status()))
                campaign = commands.transition(campaign.id(), actor, new CampaignContracts.VersionRequest(campaign.version()), step);
            records.recordCampaign(seed.key(), campaign.id());
            addedCampaigns++;
        }
        log.info("DUT catalogue imported organizations={} campaigns={} actor={}", addedOrganizations, addedCampaigns, actor);
    }

    private List<CampaignStatus> steps(CampaignStatus status) {
        return switch (status) {
            case DRAFT -> List.of();
            case OPEN -> List.of(CampaignStatus.OPEN);
            case ACTIVE -> List.of(CampaignStatus.OPEN, CampaignStatus.ACTIVE);
            case COMPLETED -> List.of(CampaignStatus.OPEN, CampaignStatus.ACTIVE, CampaignStatus.COMPLETED);
            case CANCELLED -> List.of(CampaignStatus.OPEN, CampaignStatus.CANCELLED);
        };
    }
}
