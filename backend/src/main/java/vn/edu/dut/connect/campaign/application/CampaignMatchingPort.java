package vn.edu.dut.connect.campaign.application;

import java.util.List;
import java.util.UUID;

/** Read-only matching context; no financial or contact data crosses this boundary. */
public interface CampaignMatchingPort {
    record RequiredSkill(String name, String track, int importance) {}
    record Context(String title, String description, String volunteerRequirements, List<RequiredSkill> requiredSkills, long version) {}
    Context context(UUID campaignId);
}
