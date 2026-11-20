package vn.edu.dut.connect.volunteer.api;

import static vn.edu.dut.connect.volunteer.application.VolunteerContracts.*;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;
import vn.edu.dut.connect.volunteer.application.*;
import vn.edu.dut.connect.volunteer.domain.*;

@RestController
@RequestMapping("/api/v1")
public class VolunteerController {

    private final VolunteerService service;

    public VolunteerController(VolunteerService service) {
        this.service = service;
    }

    @PostMapping("/campaigns/{campaignId}/applications")
    public ResponseEntity<ApplicationDto> apply(
        @PathVariable UUID campaignId,
        Authentication auth,
        @Valid @RequestBody ApplyRequest request
    ) {
        return ResponseEntity.status(201).body(
            service.apply(campaignId, CurrentActor.id(auth), request)
        );
    }

    @GetMapping("/me/applications")
    public PageResponse<ApplicationDto> mine(
        Authentication auth,
        @RequestParam(required = false) UUID campaignId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) RegistrationStatus status,
        @RequestParam(required = false) VolunteerTrack track
    ) {
        return PageResponse.from(
            service.mine(
                CurrentActor.id(auth),
                campaignId,
                new VolunteerQuery(page, size, status, track)
            )
        );
    }

    @GetMapping("/campaigns/{campaignId}/applications")
    public PageResponse<ApplicationDto> applicants(
        @PathVariable UUID campaignId,
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) RegistrationStatus status,
        @RequestParam(required = false) VolunteerTrack track
    ) {
        return PageResponse.from(
            service.applicants(
                campaignId,
                CurrentActor.id(auth),
                new VolunteerQuery(page, size, status, track)
            )
        );
    }

    @GetMapping("/campaigns/{campaignId}/applications/summary")
    public RecruitmentSummary summary(@PathVariable UUID campaignId, Authentication auth) {
        return service.summary(campaignId, CurrentActor.id(auth));
    }

    @PostMapping("/applications/{id}/accept")
    public ApplicationDto accept(
        @PathVariable UUID id,
        Authentication auth,
        @Valid @RequestBody AcceptRequest request
    ) {
        return service.accept(id, CurrentActor.id(auth), request);
    }

    @PostMapping("/applications/{id}/reject")
    public ApplicationDto reject(
        @PathVariable UUID id,
        Authentication auth,
        @Valid @RequestBody RejectRequest request
    ) {
        return service.reject(id, CurrentActor.id(auth), request);
    }

    @PostMapping("/applications/{id}/cancel")
    public ApplicationDto cancel(
        @PathVariable UUID id,
        Authentication auth,
        @Valid @RequestBody VersionRequest request
    ) {
        return service.cancel(id, CurrentActor.id(auth), request);
    }
}
