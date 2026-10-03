package vn.edu.dut.connect.campaign.api;
import java.util.UUID;
import java.net.URI;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
@RestController @RequestMapping("/api/v1/proposals")
public class ProposalController {
    private final ProposalService service;
    public ProposalController(ProposalService service) { this.service=service; }
    @GetMapping("/mine")
    public PageResponse<ProposalSummary> mine(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q) { return PageResponse.from(service.mine(UUID.fromString(auth.getName()),new CampaignQuery(page,size,q,null,null,null,null,null))); }
    @GetMapping("/{id}")
    public ProposalDetail get(Authentication auth, @PathVariable UUID id) { return service.get(id,UUID.fromString(auth.getName())); }
    @PostMapping
    public ResponseEntity<ProposalDetail> create(Authentication auth, @Valid @RequestBody CreateRequest request) {
        var result=service.create(UUID.fromString(auth.getName()),request);
        return ResponseEntity.created(URI.create("/api/v1/proposals/"+result.id())).body(result);
    }
    @PatchMapping("/{id}")
    public ProposalDetail edit(Authentication auth, @PathVariable UUID id, @Valid @RequestBody PatchRequest request) { return service.edit(id,UUID.fromString(auth.getName()),request); }
}
