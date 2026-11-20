package vn.edu.dut.connect.campaign.api;

import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1/proposals")
public class ProposalController {

    private final ProposalService service;

    public ProposalController(ProposalService service) {
        this.service = service;
    }

    @GetMapping("/mine")
    public PageResponse<ProposalSummary> mine(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q
    ) {
        return PageResponse.from(
            service.mine(
                CurrentActor.id(auth),
                new CampaignQuery(page, size, q, null, null, null, null, null)
            )
        );
    }

    @GetMapping("/{id}")
    public ProposalDetail get(Authentication auth, @PathVariable UUID id) {
        return service.get(id, CurrentActor.id(auth));
    }

    @PostMapping
    public ResponseEntity<ProposalDetail> create(
        Authentication auth,
        @Valid @RequestBody CreateRequest request
    ) {
        var result = service.create(CurrentActor.id(auth), request);
        return ResponseEntity.created(URI.create("/api/v1/proposals/" + result.id())).body(result);
    }

    @PatchMapping("/{id}")
    public ProposalDetail edit(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody PatchRequest request
    ) {
        return service.edit(id, CurrentActor.id(auth), request);
    }

    @PostMapping("/{id}/cancel")
    public ProposalDetail cancel(
        Authentication auth,
        @PathVariable UUID id,
        @RequestBody VersionRequest request
    ) {
        return service.cancel(id, CurrentActor.id(auth), request);
    }

    @PostMapping("/{id}/submit")
    public ProposalDetail submit(
        Authentication auth,
        @PathVariable UUID id,
        @RequestBody VersionRequest request
    ) {
        return service.submit(id, CurrentActor.id(auth), request);
    }
}
