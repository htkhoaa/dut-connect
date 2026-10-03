package vn.edu.dut.connect.dashboard.api;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.dashboard.application.*;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }
    @GetMapping("/admin/dashboard") public DashboardQuery.Admin admin(Authentication actor) { return service.admin(UUID.fromString(actor.getName())); }
    @GetMapping("/campaigns/{id}/dashboard") public DashboardService.CampaignDashboard campaign(@PathVariable UUID id, Authentication actor) { return service.campaign(id, UUID.fromString(actor.getName())); }
}
