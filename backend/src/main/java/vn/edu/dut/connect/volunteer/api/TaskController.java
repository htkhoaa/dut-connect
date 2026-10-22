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
public class TaskController {
    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping("/campaigns/{c}/tasks")
    public PageResponse<TaskDto> list(@PathVariable UUID c, Authentication a, @RequestParam(required = false) TaskStatus status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.list(c, UUID.fromString(a.getName()), status, new Pagination(page, size)));
    }

    @GetMapping("/me/tasks")
    public PageResponse<TaskDto> mine(Authentication a, @RequestParam(required = false) TaskStatus status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(service.mine(UUID.fromString(a.getName()), status, new Pagination(page, size)));
    }

    @GetMapping("/tasks/{id}")
    public TaskDto detail(@PathVariable UUID id, Authentication a) {
        return service.detail(id, UUID.fromString(a.getName()));
    }

    @PostMapping("/campaigns/{c}/tasks")
    public ResponseEntity<TaskDto> create(@PathVariable UUID c, Authentication a, @Valid @RequestBody TaskRequest r) {
        var dto = service.create(c, UUID.fromString(a.getName()), r);
        return ResponseEntity.created(java.net.URI.create("/api/v1/tasks/" + dto.id())).body(dto);
    }

    @PatchMapping("/tasks/{id}")
    public TaskDto edit(@PathVariable UUID id, Authentication a, @Valid @RequestBody TaskRequest r) {
        return service.edit(id, UUID.fromString(a.getName()), r);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication a, @RequestParam Long version) {
        service.delete(id, UUID.fromString(a.getName()), version);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{id}/start")
    public TaskDto start(@PathVariable UUID id, Authentication a, @Valid @RequestBody VersionRequest r) {
        return service.start(id, UUID.fromString(a.getName()), r.version());
    }

    @PostMapping("/tasks/{id}/done")
    public TaskDto done(@PathVariable UUID id, Authentication a, @Valid @RequestBody VersionRequest r) {
        return service.done(id, UUID.fromString(a.getName()), r.version());
    }

    @PostMapping("/tasks/{id}/verify")
    public TaskDto verify(@PathVariable UUID id, Authentication a, @Valid @RequestBody VersionRequest r) {
        return service.verify(id, UUID.fromString(a.getName()), r.version());
    }
}
