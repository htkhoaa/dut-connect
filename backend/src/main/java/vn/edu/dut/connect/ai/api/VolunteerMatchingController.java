package vn.edu.dut.connect.ai.api;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.ai.application.VolunteerMatchingService;

@RestController
@RequestMapping("/api/v1/campaigns/{campaignId}/ai")
public class VolunteerMatchingController {
    public record Request(@Size(min = 1, max = 20) List<@NotNull UUID> applicationIds) {}
    private final VolunteerMatchingService service;
    public VolunteerMatchingController(VolunteerMatchingService service) { this.service = service; }
    @PostMapping("/volunteer-matches")
    public VolunteerMatchingService.Response match(@PathVariable UUID campaignId, Authentication auth,
                                                  @Valid @RequestBody(required = false) Request request) {
        return service.match(campaignId, UUID.fromString(auth.getName()), request == null ? null : request.applicationIds());
    }
    @GetMapping("/availability")
    public VolunteerMatchingService.Availability availability(@PathVariable UUID campaignId, Authentication auth) {
        return service.availability(campaignId, UUID.fromString(auth.getName()));
    }
}
