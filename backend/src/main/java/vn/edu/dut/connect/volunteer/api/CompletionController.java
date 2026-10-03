package vn.edu.dut.connect.volunteer.api;

import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.api.PageResponse;
import vn.edu.dut.connect.volunteer.application.*;
import vn.edu.dut.connect.volunteer.domain.*;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

import vn.edu.dut.connect.volunteer.application.VolunteerContracts.VersionRequest;

@RestController
@RequestMapping("/api/v1")
public class CompletionController {
    private final CompletionService service;

    public CompletionController(CompletionService service) {
        this.service = service;
    }

    @GetMapping("/campaigns/{c}/completions")
    public PageResponse<CompletionDto> list(@PathVariable UUID c, Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.list(c, UUID.fromString(a.getName()), new Pagination(page, size)));
    }

    @PutMapping("/campaigns/{c}/volunteers/{user}/completion")
    public CompletionDto record(@PathVariable UUID c, @PathVariable UUID user, Authentication a, @Valid @RequestBody CompletionRequest r) {
        return service.record(c, user, UUID.fromString(a.getName()), r);
    }

    @GetMapping("/me/volunteer-history")
    public PageResponse<HistoryDto> history(Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.history(UUID.fromString(a.getName()), new Pagination(page, size)));
    }
}
