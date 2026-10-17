package vn.edu.dut.connect.reporting.api;

import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.reporting.application.ReportExportService;

@RestController
@RequestMapping("/api/v1/campaigns/{id}/reports")
public class ReportController {
    private final ReportExportService service;
    public ReportController(ReportExportService service) { this.service=service; }
    @GetMapping("/volunteers.xlsx") public ResponseEntity<byte[]> volunteers(@PathVariable UUID id, Authentication actor) { return download(service.volunteers(id,UUID.fromString(actor.getName())),"volunteers-"+id+".xlsx"); }
    private ResponseEntity<byte[]> download(byte[] bytes,String filename) {
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(filename).build().toString())
            .header(HttpHeaders.CACHE_CONTROL,"private, no-store").contentLength(bytes.length).body(bytes);
    }
}
