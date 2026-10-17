package vn.edu.dut.connect.shared.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.dut.connect.shared.application.EditionService;

@RestController
public class EditionController {
    private final EditionService service;
    public EditionController(EditionService service) { this.service = service; }
    @GetMapping("/api/v1/system/edition")
    public EditionService.Edition edition() { return service.describe(); }
}
