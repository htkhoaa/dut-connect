package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import org.springframework.stereotype.Service;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Service
public class CoordinationAuthorization {
    private final CampaignAccessPort campaigns;
    private final IdentityDirectoryPort identities;
    private final AcceptedVolunteerRepository volunteers;

    public CoordinationAuthorization(CampaignAccessPort campaigns, IdentityDirectoryPort identities, AcceptedVolunteerRepository volunteers) {
        this.campaigns = campaigns;
        this.identities = identities;
        this.volunteers = volunteers;
    }

    public boolean manager(UUID campaign, UUID actor) {
        var a = identities.findAccount(actor).orElseThrow(() -> ApplicationFailure.missing("Account not found"));
        if (!a.active()) denied();
        return a.admin() || campaigns.isManager(campaign, actor);
    }

    public void requireManager(UUID campaign, UUID actor) {
        campaigns.getCampaign(campaign);
        if (!manager(campaign, actor)) denied();
    }

    public boolean view(UUID campaign, UUID actor) {
        campaigns.getCampaign(campaign);
        boolean manager = manager(campaign, actor);
        if (!manager && !volunteers.accepted(campaign, Set.of(actor)).containsKey(actor)) denied();
        return manager;
    }

    public boolean operational(UUID campaign) {
        return operational(campaigns.getCampaign(campaign).status());
    }

    public void requireOperationalWrite(UUID campaign, UUID actor) {
        requireWrite(campaign, actor, WritePurpose.OPERATIONAL);
    }

    public void requireCompletionWrite(UUID campaign, UUID actor) {
        requireWrite(campaign, actor, WritePurpose.COMPLETION);
        requireManager(campaign, actor);
    }

    private void requireWrite(UUID campaign, UUID actor, WritePurpose purpose) {
        var c = campaigns.lockCampaign(campaign);
        var a = identities.lockAccount(actor).orElseThrow(() -> ApplicationFailure.missing("Account not found"));
        if (!a.active()) denied();
        if (!operational(c.status()) && !(purpose == WritePurpose.COMPLETION && c.status() == CampaignStatus.COMPLETED))
            throw new ApplicationFailure(409, "INVALID_STATE_TRANSITION", "Campaign does not permit this operation");
    }

    private static boolean operational(CampaignStatus status) {
        return status == CampaignStatus.OPEN || status == CampaignStatus.ACTIVE;
    }

    private enum WritePurpose {OPERATIONAL, COMPLETION}

    public void accepted(UUID campaign, List<UUID> users) {
        if (users == null || users.size() > 100 || users.stream().anyMatch(Objects::isNull) || new HashSet<>(users).size() != users.size())
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Choose at most 100 distinct volunteers");
        if (volunteers.accepted(campaign, new HashSet<>(users)).size() != users.size())
            throw new ApplicationFailure(409, "VOLUNTEER_NOT_ACCEPTED", "Every participant must be an accepted volunteer of this campaign");
    }

    public static void denied() {
        throw new ApplicationFailure(403, "ACCESS_DENIED", "Campaign coordination permission required");
    }
}
