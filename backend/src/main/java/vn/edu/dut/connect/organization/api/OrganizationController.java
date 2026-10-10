package vn.edu.dut.connect.organization.api;
import java.net.URI;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.organization.application.*;
import vn.edu.dut.connect.organization.domain.OrganizationStatus;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
@RestController
@RequestMapping("/api/v1")
public class OrganizationController {
    private final OrganizationService service;
    private final OrganizationMembershipService memberships;
    public OrganizationController(OrganizationService service, OrganizationMembershipService memberships) {
        this.service=service;
        this.memberships=memberships;
    }
    @GetMapping("/organizations")
    public PageResponse<Summary> browse(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
    @RequestParam(required=false) String q, @RequestParam(required=false) OrganizationStatus status) {
        return PageResponse.from(service.browse(new OrganizationQuery(page, size, q), status));
    }
    @GetMapping("/organizations/{id}")
    public Detail get(@PathVariable UUID id, Authentication auth) {
        return service.get(id, auth==null?null:UUID.fromString(auth.getName()));
    }
    @GetMapping("/organization-types")
    public PageResponse<TypeSummary> types(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return PageResponse.from(service.types(actor(auth), new OrganizationQuery(page, size, null)));
    }
    @GetMapping("/me/organizations")
    public PageResponse<Summary> mine(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return PageResponse.from(service.mine(actor(auth), new OrganizationQuery(page, size, null)));
    }
    @PostMapping("/organizations")
    public ResponseEntity<Detail> create(Authentication auth, @Valid @RequestBody CreateRequest request) {
        Detail result=service.create(actor(auth), request);
        return ResponseEntity.created(URI.create("/api/v1/organizations/"+result.organization().id())).body(result);
    }
    @PatchMapping("/organizations/{id}")
    public Detail edit(Authentication auth, @PathVariable UUID id, @Valid @RequestBody PatchRequest request) {
        return service.edit(id, actor(auth), request);
    }
    @GetMapping("/organizations/{id}/members")
    public PageResponse<Member> members(Authentication auth, @PathVariable UUID id, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return PageResponse.from(memberships.list(id, actor(auth), new OrganizationQuery(page, size, null)));
    }
    @PostMapping("/organizations/{id}/members")
    public ResponseEntity<MemberAdded> add(Authentication auth, @PathVariable UUID id, @Valid @RequestBody AddMemberRequest request) {
        MemberAdded result=memberships.add(id, actor(auth), request);
        return ResponseEntity.created(URI.create("/api/v1/organizations/"+id+"/members/"+result.member().userId())).body(result);
    }
    @PatchMapping("/organizations/{id}/members/{user}")
    public Detail role(Authentication auth, @PathVariable UUID id, @PathVariable UUID user, @Valid @RequestBody RoleRequest request) {
        return memberships.change(id, actor(auth), user, request);
    }
    @DeleteMapping("/organizations/{id}/members/{user}")
    public ResponseEntity<Void> remove(Authentication auth, @PathVariable UUID id, @PathVariable UUID user, @RequestParam long version) {
        memberships.remove(id, actor(auth), user, version);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/organizations/{id}/transfer-ownership")
    public Detail transfer(Authentication auth, @PathVariable UUID id, @Valid @RequestBody TransferRequest request) {
        return memberships.transfer(id, actor(auth), request);
    }
    private static UUID actor(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
