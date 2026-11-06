package vn.edu.dut.connect.campaign.application;
import java.util.UUID;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.List;
import vn.edu.dut.connect.campaign.domain.*;
public interface CampaignAccessPort {
    record Funding(java.math.BigDecimal institutional, java.math.BigDecimal sponsor, java.math.BigDecimal goal) {}
    Funding funding(UUID id);
    record Snapshot(UUID id, CampaignStatus status, ContributionMode contributionMode, Instant applicationDeadline, Instant fundraisingDeadline, Integer targetVolunteerCount, Integer targetTechnicalCount, Integer targetLogisticsCount, String title, String slug, UUID ownerId) {
        public Snapshot(UUID id, CampaignStatus status, ContributionMode contributionMode, Instant applicationDeadline, Instant fundraisingDeadline, Integer targetVolunteerCount, Integer targetTechnicalCount, Integer targetLogisticsCount, String title, String slug) {
            this(id, status, contributionMode, applicationDeadline, fundraisingDeadline, targetVolunteerCount, targetTechnicalCount, targetLogisticsCount, title, slug, null);
        }
    }
    Snapshot getCampaign(UUID id);
    Snapshot lockCampaign(UUID id);
    Map<UUID, Snapshot> getCampaigns(Set<UUID> ids);
    Set<UUID> managedCampaigns(Set<UUID> ids,UUID userId);
    List<UUID> managers(UUID campaignId);
    boolean isManager(UUID campaignId, UUID userId);
}
