package vn.edu.dut.connect.volunteer.application;

import java.util.*;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.campaign.domain.ContributionMode;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.shared.application.*;
import static vn.edu.dut.connect.volunteer.application.VolunteerContracts.*;

@Service @Transactional(readOnly=true)
public class VolunteerService {
    private static final Logger log=LoggerFactory.getLogger(VolunteerService.class);
    private final VolunteerRepository registrations;
    private final CampaignAccessPort campaigns;
    private final IdentityDirectoryPort identities;
    public VolunteerService(VolunteerRepository registrations,CampaignAccessPort campaigns,IdentityDirectoryPort identities) {
        this.registrations=registrations;this.campaigns=campaigns;this.identities=identities;
    }
    @Transactional
    public ApplicationDto apply(UUID campaignId,UUID actor,ApplyRequest request) {
        var campaign=campaigns.lockCampaign(campaignId);activeLocked(actor);
        if(registrations.exists(campaignId,actor)) throw new ApplicationFailure(409,"DUPLICATE_APPLICATION","You already have an application for this campaign");
        if(campaign.status()!=CampaignStatus.OPEN) throw new ApplicationFailure(409,"CAMPAIGN_NOT_OPEN","Campaign must be open for applications");
        if(campaign.contributionMode()==ContributionMode.DONATION_ONLY) throw new ApplicationFailure(409,"CAMPAIGN_NOT_ACCEPTING_VOLUNTEERS","This campaign does not accept volunteers");
        if(campaign.applicationDeadline()!=null && Instant.now().isAfter(campaign.applicationDeadline()))
            throw new ApplicationFailure(409,"CAMPAIGN_NOT_ACCEPTING_VOLUNTEERS","The application deadline has passed");
        var v=registrations.save(new VolunteerRegistration(campaignId,actor,request.preferredTrack(),request.motivation(),request.availability()));
        log.info("Volunteer applied actor={} campaign={} application={}",actor,campaignId,v.id());
        return dto(v);
    }
    @Transactional
    public ApplicationDto accept(UUID id,UUID actor,AcceptRequest request) {
        var v=reviewable(id,actor);v.requireVersion(request.version());activeLocked(v.userId());
        v.accept(request.assignedTrack(),actor);registrations.save(v);logTransition(v,actor);return dto(v);
    }
    @Transactional
    public ApplicationDto reject(UUID id,UUID actor,RejectRequest request) {
        var v=reviewable(id,actor);v.requireVersion(request.version());v.reject(request.reason(),actor);
        registrations.save(v);logTransition(v,actor);return dto(v);
    }
    @Transactional
    public ApplicationDto cancel(UUID id,UUID actor,VersionRequest request) {
        UUID campaignId=campaignOf(id);campaigns.lockCampaign(campaignId);activeLocked(actor);
        var v=locked(id);
        if(!v.userId().equals(actor)) denied();
        v.requireVersion(request.version());v.cancel();registrations.save(v);logTransition(v,actor);return dto(v);
    }
    public PageResult<ApplicationDto> mine(UUID actor,UUID campaignId,VolunteerQuery query) {
        active(actor);return dtos(registrations.list(campaignId,actor,query));
    }
    public PageResult<ApplicationDto> applicants(UUID campaignId,UUID actor,VolunteerQuery query) {
        manager(campaignId,actor);campaigns.getCampaign(campaignId);return dtos(registrations.list(campaignId,null,query));
    }
    public RecruitmentSummary summary(UUID campaignId,UUID actor) {
        manager(campaignId,actor);var c=campaigns.getCampaign(campaignId);var counts=registrations.counts(campaignId);
        return new RecruitmentSummary(counts.accepted(),counts.technical(),counts.logistics(),c.targetVolunteerCount(),c.targetTechnicalCount(),c.targetLogisticsCount(),
            c.status()==CampaignStatus.OPEN || c.status()==CampaignStatus.ACTIVE);
    }
    private VolunteerRegistration reviewable(UUID id,UUID actor) {
        UUID campaignId=campaignOf(id);var c=campaigns.lockCampaign(campaignId);activeLocked(actor);manager(campaignId,actor);
        if(c.status()!=CampaignStatus.OPEN && c.status()!=CampaignStatus.ACTIVE)
            throw new ApplicationFailure(409,"INVALID_STATE_TRANSITION","Applications can be reviewed only in open or active campaigns");
        return locked(id);
    }
    private UUID campaignOf(UUID id){return registrations.campaignOf(id).orElseThrow(()->ApplicationFailure.missing("Application not found"));}
    private VolunteerRegistration locked(UUID id){return registrations.lock(id).orElseThrow(()->ApplicationFailure.missing("Application not found"));}
    private IdentityDirectoryPort.Account active(UUID actor) {
        var account=identities.findAccount(actor).orElseThrow(()->new ApplicationFailure(401,"AUTHENTICATION_REQUIRED","Account unavailable"));
        if(!account.active()) denied();return account;
    }
    private void activeLocked(UUID actor) {
        var account=identities.lockAccount(actor).orElseThrow(()->ApplicationFailure.missing("Account not found"));
        if(!account.active()) throw new ApplicationFailure(403,"ACCESS_DENIED","Account is suspended");
    }
    private void manager(UUID campaignId,UUID actor) {if(!active(actor).admin() && !campaigns.isManager(campaignId,actor)) denied();}
    private static void denied(){throw new ApplicationFailure(403,"ACCESS_DENIED","Application permission required");}
    private void logTransition(VolunteerRegistration v,UUID actor){log.info("Volunteer application transitioned actor={} campaign={} application={} status={}",actor,v.campaignId(),v.id(),v.status());}
    private ApplicationDto dto(VolunteerRegistration v){return dtos(new PageResult<>(List.of(v),0,1,1,1,false,false)).items().getFirst();}
    private PageResult<ApplicationDto> dtos(PageResult<VolunteerRegistration> page) {
        var accounts=identities.findAccounts(page.items().stream().map(VolunteerRegistration::userId).collect(Collectors.toSet()));
        var campaignViews=campaigns.getCampaigns(page.items().stream().map(VolunteerRegistration::campaignId).collect(Collectors.toSet()));
        return page.map(v->{var account=accounts.get(v.userId());var campaign=campaignViews.get(v.campaignId());
            return new ApplicationDto(v.id(),v.campaignId(),campaign.title(),campaign.slug(),v.userId(),account.fullName(),account.studentId(),v.preferredTrack(),v.assignedTrack(),
                v.motivation(),v.availability(),v.status(),v.rejectionReason(),v.reviewedByUserId(),v.reviewedAt(),v.createdAt(),v.updatedAt(),v.version());});
    }
}
