package vn.edu.dut.connect.campaign.api;

import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.api.CurrentActor;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping("/campaign-categories")
    public PageResponse<CategoryDto> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q
    ) {
        return PageResponse.from(
            service.list(new CampaignQuery(page, size, q, null, null, null, null, null))
        );
    }

    @GetMapping("/admin/campaign-categories")
    public PageResponse<CategoryDto> adminList(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q
    ) {
        return PageResponse.from(
            service.adminList(
                CurrentActor.id(auth),
                new CampaignQuery(page, size, q, null, null, null, null, null)
            )
        );
    }

    @PostMapping("/admin/campaign-categories")
    public ResponseEntity<CategoryDto> create(
        Authentication auth,
        @Valid @RequestBody CategoryRequest request
    ) {
        var result = service.create(CurrentActor.id(auth), request);
        return ResponseEntity.created(
            URI.create("/api/v1/admin/campaign-categories/" + result.id())
        ).body(result);
    }

    @PatchMapping("/admin/campaign-categories/{id}")
    public CategoryDto edit(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody CategoryRequest request
    ) {
        return service.edit(id, CurrentActor.id(auth), request);
    }
}
