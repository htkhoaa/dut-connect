package vn.edu.dut.connect.identity.api;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.identity.application.ProfileService;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping("/skills")
    public PageResponse<SkillResponse> skills(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return PageResponse.from(service.catalog(page, size));
    }

    @GetMapping("/me/profile")
    public ProfileResponse get(Authentication auth) {
        return service.get(CurrentActor.id(auth));
    }

    @PutMapping("/me/profile")
    public ProfileResponse update(Authentication auth, @Valid @RequestBody ProfileRequest request) {
        return service.update(CurrentActor.id(auth), request);
    }

    @PutMapping("/me/skills")
    public ProfileResponse skills(Authentication auth, @Valid @RequestBody SkillsRequest request) {
        return service.updateSkills(CurrentActor.id(auth), request);
    }
}
