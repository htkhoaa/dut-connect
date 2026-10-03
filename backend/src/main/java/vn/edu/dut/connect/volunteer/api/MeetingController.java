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
public class MeetingController {
    private final MeetingService service;

    public MeetingController(MeetingService service) {
        this.service = service;
    }

    @GetMapping("/campaigns/{c}/meetings")
    public PageResponse<MeetingDto> list(@PathVariable UUID c, Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.list(c, UUID.fromString(a.getName()), new Pagination(page, size)));
    }

    @PostMapping("/campaigns/{c}/meetings")
    public ResponseEntity<MeetingDto> create(@PathVariable UUID c, Authentication a, @Valid @RequestBody MeetingRequest r) {
        return ResponseEntity.status(201).body(service.create(c, UUID.fromString(a.getName()), r));
    }

    @PatchMapping("/meetings/{id}")
    public MeetingDto edit(@PathVariable UUID id, Authentication a, @Valid @RequestBody MeetingRequest r) {
        return service.edit(id, UUID.fromString(a.getName()), r);
    }

    @DeleteMapping("/meetings/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication a, @RequestParam Long version) {
        service.delete(id, UUID.fromString(a.getName()), version);
        return ResponseEntity.noContent().build();
    }
}
