package vn.edu.dut.connect.campaign.api;

import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/proposals")
public class AdminProposalController {

    private final ProposalService views;
    private final ProposalReviewService reviews;

    public AdminProposalController(ProposalService views, ProposalReviewService reviews) {
        this.views = views;
        this.reviews = reviews;
    }

    @GetMapping
    public PageResponse<ProposalSummary> list(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) ProposalStatus status
    ) {
        return PageResponse.from(
            views.adminList(
                CurrentActor.id(auth),
                new CampaignQuery(page, size, q, null, null, null, null, null),
                status
            )
        );
    }

    @PostMapping("/{id}/approve")
    public CampaignDetail approve(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody VersionRequest request
    ) {
        return reviews.approve(id, CurrentActor.id(auth), request);
    }

    @PostMapping("/{id}/reject")
    public ProposalDetail reject(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody RejectRequest request
    ) {
        return reviews.reject(id, CurrentActor.id(auth), request);
    }
}
