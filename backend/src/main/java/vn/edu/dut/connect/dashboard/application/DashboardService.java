package vn.edu.dut.connect.dashboard.application;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
@Service
@Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class DashboardService {
 public record CampaignDashboard(UUID campaignId,DashboardQuery.Campaign operations) {}
 private final DashboardQuery query;
 private final CampaignAuthorization access;
 private final CampaignAccessPort campaigns;
 public DashboardService(DashboardQuery query,CampaignAuthorization access,CampaignAccessPort campaigns){this.query=query;this.access=access;this.campaigns=campaigns;}
 public DashboardQuery.Admin admin(UUID actor){access.admin(actor);return query.admin();}
 public CampaignDashboard campaign(UUID id,UUID actor){access.manager(id,actor);campaigns.getCampaign(id);return new CampaignDashboard(id,query.campaign(id));}
}
