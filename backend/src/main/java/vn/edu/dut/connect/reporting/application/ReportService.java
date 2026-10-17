package vn.edu.dut.connect.reporting.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import static vn.edu.dut.connect.reporting.application.ReportQuery.Sheet;
@Service
@Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
public class ReportService {
 private final ReportQuery query;private final CampaignAuthorization access;private final CampaignAccessPort campaigns;
 public ReportService(ReportQuery query,CampaignAuthorization access,CampaignAccessPort campaigns){this.query=query;this.access=access;this.campaigns=campaigns;}
 public List<Sheet> volunteers(UUID id,UUID actor){access.manager(id,actor);campaigns.getCampaign(id);return List.of(new Sheet("Volunteers",List.of("Full Name","Student ID","Faculty","Campaign","Assigned Contribution Track","Application Status","Present Attendance Sessions","Total Attendance Sessions"),query.volunteers(id)));}
}
