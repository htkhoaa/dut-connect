package vn.edu.dut.connect.campaign.api;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@RestController @RequestMapping("/api/v1/admin/proposals")
public class AdminProposalController {
    private final ProposalService views;
    private final ProposalReviewService reviews;
    public AdminProposalController(ProposalService views, ProposalReviewService reviews) { this.views=views; this.reviews=reviews; }
    @GetMapping
    public PageResponse<ProposalSummary> list(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q, @RequestParam(required=false) ProposalStatus status) { return PageResponse.from(views.adminList(UUID.fromString(auth.getName()),new CampaignQuery(page,size,q,null,null,null,null,null),status)); }
    @PostMapping("/{id}/approve")
    public CampaignDetail approve(Authentication auth, @PathVariable UUID id, @Valid @RequestBody VersionRequest request) { return reviews.approve(id,UUID.fromString(auth.getName()),request); }
    @PostMapping("/{id}/reject")
    public ProposalDetail reject(Authentication auth, @PathVariable UUID id, @Valid @RequestBody RejectRequest request) { return reviews.reject(id,UUID.fromString(auth.getName()),request); }
}
