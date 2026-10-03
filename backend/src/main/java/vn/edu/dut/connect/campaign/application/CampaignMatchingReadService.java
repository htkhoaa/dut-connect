package vn.edu.dut.connect.campaign.application;

import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.application.SkillCatalogPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
@Transactional(readOnly = true)
public class CampaignMatchingReadService implements CampaignMatchingPort {
    private final CampaignRepository campaigns;
    private final SkillCatalogPort skills;

    public CampaignMatchingReadService(CampaignRepository campaigns, SkillCatalogPort skills) {
        this.campaigns = campaigns;
        this.skills = skills;
    }

    public Context context(UUID campaignId) {
        var campaign = campaigns.find(campaignId).orElseThrow(() -> ApplicationFailure.missing("Campaign not found"));
        var requirements = campaigns.skills(campaignId);
        var catalog = skills.findSkills(requirements.stream().map(CampaignContracts.Requirement::skillId).collect(Collectors.toSet()));
        var values = campaign.content();
        return new Context(values.title(), values.description(), values.volunteerRequirements(),
                requirements.stream().map(r -> new RequiredSkill(catalog.get(r.skillId()).name(), r.track().name(), r.importance()))
                        .sorted(java.util.Comparator.comparing(RequiredSkill::name).thenComparing(RequiredSkill::track)).toList(), campaign.version());
    }
}
