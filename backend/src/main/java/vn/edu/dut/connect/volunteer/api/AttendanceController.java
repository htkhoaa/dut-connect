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


@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private final AttendanceService service;

    public AttendanceController(AttendanceService service) {
        this.service = service;
    }

    @GetMapping("/campaigns/{c}/attendance-sessions")
    public PageResponse<SessionDto> list(@PathVariable UUID c, Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.list(c, UUID.fromString(a.getName()), new Pagination(page, size)));
    }

    @PostMapping("/campaigns/{c}/attendance-sessions")
    public ResponseEntity<SessionDto> create(@PathVariable UUID c, Authentication a, @Valid @RequestBody SessionRequest r) {
        return ResponseEntity.status(201).body(service.create(c, UUID.fromString(a.getName()), r));
    }

    @PatchMapping("/attendance-sessions/{id}")
    public SessionDto edit(@PathVariable UUID id, Authentication a, @Valid @RequestBody SessionRequest r) {
        return service.edit(id, UUID.fromString(a.getName()), r);
    }

    @DeleteMapping("/attendance-sessions/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication a, @RequestParam Long version) {
        service.delete(id, UUID.fromString(a.getName()), version);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/attendance-sessions/{id}/records")
    public PageResponse<AttendanceDto> records(@PathVariable UUID id, Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.records(id, UUID.fromString(a.getName()), new Pagination(page, size)));
    }

    @PutMapping("/attendance-sessions/{id}/records")
    public AttendanceResult record(@PathVariable UUID id, Authentication a, @Valid @RequestBody AttendanceRequest r) {
        return service.record(id, UUID.fromString(a.getName()), r);
    }
}
