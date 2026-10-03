package vn.edu.dut.connect.ai.application;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.identity.application.*;
import vn.edu.dut.connect.volunteer.application.VolunteerMatchingPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class MatchingSnapshots {
    public record Snapshot(CampaignMatchingPort.Context campaign, List<VolunteerMatchingPort.Applicant> applicants,
                           Map<UUID, ProfileMatchingPort.Profile> profiles) {}
    private final CampaignAccessPort access;
    private final CampaignMatchingPort campaigns;
    private final VolunteerMatchingPort volunteers;
    private final IdentityDirectoryPort identities;
    private final ProfileMatchingPort profiles;

    public MatchingSnapshots(CampaignAccessPort access, CampaignMatchingPort campaigns, VolunteerMatchingPort volunteers,
                             IdentityDirectoryPort identities, ProfileMatchingPort profiles) {
        this.access = access; this.campaigns = campaigns; this.volunteers = volunteers; this.identities = identities; this.profiles = profiles;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Snapshot read(UUID campaignId, UUID actor, List<UUID> ids, int limit) {
        authorize(campaignId, actor);
        var campaign = access.getCampaign(campaignId);
        if (campaign.contributionMode() == ContributionMode.DONATION_ONLY ||
                (campaign.status() != CampaignStatus.OPEN && campaign.status() != CampaignStatus.ACTIVE))
            throw new ApplicationFailure(409, "INVALID_STATE_TRANSITION", "AI matching requires an open or active volunteer campaign");
        var applicants = volunteers.pending(campaignId, ids, limit);
        if (ids != null && applicants.size() != ids.size())
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Select only current pending applications from this campaign");
        var candidateProfiles = profiles.profiles(applicants.stream().map(VolunteerMatchingPort.Applicant::userId).collect(Collectors.toSet()));
        if (ids != null && applicants.stream().anyMatch(a -> !candidateProfiles.containsKey(a.userId()) || !candidateProfiles.get(a.userId()).active()))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Selected applicants must have active accounts and profiles");
        var eligible = applicants.stream().filter(a -> candidateProfiles.containsKey(a.userId()) && candidateProfiles.get(a.userId()).active()).toList();
        Map<UUID, ProfileMatchingPort.Profile> selected = new HashMap<>();
        for (var a : eligible) selected.put(a.userId(), candidateProfiles.get(a.userId()));
        return new Snapshot(campaigns.context(campaignId), eligible, Map.copyOf(selected));
    }

    @Transactional(readOnly = true)
    public void authorize(UUID campaignId, UUID actor) {
        var account = identities.findAccount(actor).orElseThrow(() -> new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Account unavailable"));
        if (!account.active()) throw new ApplicationFailure(403, "ACCESS_DENIED", "Active account required");
        access.getCampaign(campaignId);
        if (!account.admin() && !access.isManager(campaignId, actor))
            throw new ApplicationFailure(403, "ACCESS_DENIED", "Campaign manager permission required");
    }
}
