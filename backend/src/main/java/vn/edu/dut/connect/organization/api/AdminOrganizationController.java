package vn.edu.dut.connect.organization.api;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.organization.application.*;
import vn.edu.dut.connect.organization.domain.OrganizationStatus;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
@RestController @RequestMapping("/api/v1/admin/organizations")
public class AdminOrganizationController {
    private final OrganizationService service;
    public AdminOrganizationController(OrganizationService service) {
        this.service=service;
    }
    @GetMapping
    public PageResponse<Summary> list(Authentication auth, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
    @RequestParam(required=false) String q, @RequestParam(required=false) OrganizationStatus status) {
        return PageResponse.from(service.adminList(UUID.fromString(auth.getName()), new OrganizationQuery(page, size, q), status));
    }
    @PostMapping("/{id}/verify") public Detail verify(Authentication auth, @PathVariable UUID id, @Valid @RequestBody VersionRequest request) {
        return service.moderate(id, UUID.fromString(auth.getName()), request, OrganizationService.Moderation.VERIFY);
    }
    @PostMapping("/{id}/suspend") public Detail suspend(Authentication auth, @PathVariable UUID id, @Valid @RequestBody VersionRequest request) {
        return service.moderate(id, UUID.fromString(auth.getName()), request, OrganizationService.Moderation.SUSPEND);
    }
    @PostMapping("/{id}/restore") public Detail restore(Authentication auth, @PathVariable UUID id, @Valid @RequestBody VersionRequest request) {
        return service.moderate(id, UUID.fromString(auth.getName()), request, OrganizationService.Moderation.RESTORE);
    }
}
