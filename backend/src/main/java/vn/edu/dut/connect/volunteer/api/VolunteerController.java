package vn.edu.dut.connect.volunteer.api;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.volunteer.application.*;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.volunteer.application.VolunteerContracts.*;
@RestController @RequestMapping("/api/v1")
public class VolunteerController {
    private final VolunteerService service;
    public VolunteerController(VolunteerService service){this.service=service;}
    @PostMapping("/campaigns/{campaignId}/applications")
    public ResponseEntity<ApplicationDto> apply(@PathVariable UUID campaignId,Authentication auth,@Valid @RequestBody ApplyRequest request) {
        return ResponseEntity.status(201).body(service.apply(campaignId,UUID.fromString(auth.getName()),request));
    }
    @GetMapping("/me/applications")
    public PageResponse<ApplicationDto> mine(Authentication auth,@RequestParam(required=false) UUID campaignId,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(required=false) RegistrationStatus status,@RequestParam(required=false) VolunteerTrack track) {
        return PageResponse.from(service.mine(UUID.fromString(auth.getName()),campaignId,new VolunteerQuery(page,size,status,track)));
    }
    @GetMapping("/campaigns/{campaignId}/applications")
    public PageResponse<ApplicationDto> applicants(@PathVariable UUID campaignId,Authentication auth,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(required=false) RegistrationStatus status,@RequestParam(required=false) VolunteerTrack track) {
        return PageResponse.from(service.applicants(campaignId,UUID.fromString(auth.getName()),new VolunteerQuery(page,size,status,track)));
    }
    @GetMapping("/campaigns/{campaignId}/applications/summary")
    public RecruitmentSummary summary(@PathVariable UUID campaignId,Authentication auth) {return service.summary(campaignId,UUID.fromString(auth.getName()));}
    @PostMapping("/applications/{id}/accept")
    public ApplicationDto accept(@PathVariable UUID id,Authentication auth,@Valid @RequestBody AcceptRequest request){return service.accept(id,UUID.fromString(auth.getName()),request);}
    @PostMapping("/applications/{id}/reject")
    public ApplicationDto reject(@PathVariable UUID id,Authentication auth,@Valid @RequestBody RejectRequest request){return service.reject(id,UUID.fromString(auth.getName()),request);}
    @PostMapping("/applications/{id}/cancel")
    public ApplicationDto cancel(@PathVariable UUID id,Authentication auth,@Valid @RequestBody VersionRequest request){return service.cancel(id,UUID.fromString(auth.getName()),request);}
}
