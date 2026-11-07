package vn.edu.dut.connect.identity.api;

import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.identity.application.AdminUserService;
import vn.edu.dut.connect.shared.api.PageResponse;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<UserSummary> list(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String q) {
        String filterName = name;
        String filterStudentId = studentId;
        if ((filterName == null || filterName.isBlank()) && (filterStudentId == null || filterStudentId.isBlank()) && q != null && !q.isBlank()) {
            filterName = q;
            filterStudentId = q;
        }
        return PageResponse.from(service.list(UUID.fromString(auth.getName()), page, size, filterName, filterStudentId));
    }

    @PatchMapping("/{id}/status")
    public UserSummary status(Authentication auth, @PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return service.status(UUID.fromString(auth.getName()), id, request);
    }
}
