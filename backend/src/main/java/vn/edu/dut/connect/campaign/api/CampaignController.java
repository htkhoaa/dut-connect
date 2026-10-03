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
@RestController @RequestMapping("/api/v1")
public class CampaignController {
    private final CampaignReadService views;
    private final CampaignCommandService commands;
    public CampaignController(CampaignReadService views, CampaignCommandService commands) { this.views=views; this.commands=commands; }
    @GetMapping("/campaigns")
    public PageResponse<CampaignSummary> list(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q, @RequestParam(required=false) CampaignStatus status,
            @RequestParam(required=false) UUID categoryId, @RequestParam(required=false) ContributionMode contributionMode,
            @RequestParam(required=false) UUID organizationId, @RequestParam(defaultValue="newest") String sort) { return PageResponse.from(views.browse(new CampaignQuery(page,size,q,status,categoryId,contributionMode,organizationId,sort))); }
    @GetMapping("/me/campaigns")
    public PageResponse<CampaignSummary> mine(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q, @RequestParam(required=false) CampaignStatus status,
            @RequestParam(required=false) UUID categoryId, @RequestParam(required=false) ContributionMode contributionMode,
            @RequestParam(required=false) UUID organizationId, @RequestParam(defaultValue="newest") String sort) { return PageResponse.from(views.mine(UUID.fromString(auth.getName()),new CampaignQuery(page,size,q,status,categoryId,contributionMode,organizationId,sort))); }
    @GetMapping("/admin/campaigns")
    public PageResponse<CampaignSummary> adminList(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size, @RequestParam(required=false) String q, @RequestParam(required=false) CampaignStatus status,
            @RequestParam(required=false) UUID categoryId, @RequestParam(required=false) ContributionMode contributionMode,
            @RequestParam(required=false) UUID organizationId, @RequestParam(defaultValue="newest") String sort) { return PageResponse.from(views.adminList(UUID.fromString(auth.getName()),new CampaignQuery(page,size,q,status,categoryId,contributionMode,organizationId,sort))); }
    @GetMapping("/campaigns/{idOrSlug}")
    public CampaignDetail get(@PathVariable String idOrSlug, Authentication auth) { return views.get(idOrSlug,auth==null?null:UUID.fromString(auth.getName())); }
    @PatchMapping("/campaigns/{id}")
    public CampaignDetail edit(@PathVariable UUID id, Authentication auth, @Valid @RequestBody PatchRequest request) { return commands.edit(id,UUID.fromString(auth.getName()),request); }
    @PostMapping("/campaigns/{id}/open")
    public CampaignDetail open(@PathVariable UUID id, Authentication auth, @Valid @RequestBody VersionRequest request) { return commands.transition(id,UUID.fromString(auth.getName()),request,CampaignStatus.OPEN); }
    @PostMapping("/campaigns/{id}/start")
    public CampaignDetail start(@PathVariable UUID id, Authentication auth, @Valid @RequestBody VersionRequest request) { return commands.transition(id,UUID.fromString(auth.getName()),request,CampaignStatus.ACTIVE); }
    @PostMapping("/campaigns/{id}/complete")
    public CampaignDetail complete(@PathVariable UUID id, Authentication auth, @Valid @RequestBody VersionRequest request) { return commands.transition(id,UUID.fromString(auth.getName()),request,CampaignStatus.COMPLETED); }
    @PostMapping("/campaigns/{id}/cancel")
    public CampaignDetail cancel(@PathVariable UUID id, Authentication auth, @Valid @RequestBody VersionRequest request) { return commands.transition(id,UUID.fromString(auth.getName()),request,CampaignStatus.CANCELLED); }
}
