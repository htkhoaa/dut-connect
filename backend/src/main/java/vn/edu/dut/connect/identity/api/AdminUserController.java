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
    public PageResponse<UserSummary> list(Authentication auth, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.list(UUID.fromString(auth.getName()), page, size));
    }

    @PatchMapping("/{id}/status")
    public UserSummary status(Authentication auth, @PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        return service.status(UUID.fromString(auth.getName()), id, request);
    }
}
