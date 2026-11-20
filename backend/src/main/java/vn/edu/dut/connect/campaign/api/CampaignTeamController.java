package vn.edu.dut.connect.campaign.api;

import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1/campaigns/{id}")
public class CampaignTeamController {

    private final CampaignSkillsService skills;

    public CampaignTeamController(CampaignSkillsService skills) {
        this.skills = skills;
    }

    @GetMapping("/skill-requirements")
    public PageResponse<SkillDto> skills(
        @PathVariable UUID id,
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q
    ) {
        return PageResponse.from(
            skills.list(
                id,
                CurrentActor.id(auth),
                new CampaignQuery(page, size, q, null, null, null, null, null)
            )
        );
    }

    @PutMapping("/skill-requirements")
    public CampaignDetail replace(
        @PathVariable UUID id,
        Authentication auth,
        @Valid @RequestBody SkillsRequest request
    ) {
        return skills.replace(id, CurrentActor.id(auth), request);
    }
}
