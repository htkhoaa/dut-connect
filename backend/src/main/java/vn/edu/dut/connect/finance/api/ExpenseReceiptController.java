package vn.edu.dut.connect.finance.api;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.finance.application.ExpenseReceiptService;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import java.io.IOException;
import java.util.UUID;
import vn.edu.dut.connect.shared.api.UploadedFiles;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/v1")
public class ExpenseReceiptController {

    private final ExpenseReceiptService receiptService;

    public ExpenseReceiptController(ExpenseReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @PutMapping(value = "/expenses/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> upload(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            Authentication auth) throws IOException {
        if (auth == null) {
            throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        }
        var uploaded = UploadedFiles.receipt(file);
        receiptService.upload(id, UUID.fromString(auth.getName()), uploaded.bytes(), uploaded.contentType());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/expenses/{id}/receipt")
    public ResponseEntity<byte[]> download(@PathVariable UUID id, Authentication auth) {
        UUID actor = auth == null ? null : UUID.fromString(auth.getName());
        var receipt = receiptService.download(id, actor);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(receipt.contentType()))
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + id
                        + ("application/pdf".equals(receipt.contentType()) ? ".pdf" : ".img"))
                .body(receipt.data());
    }

    @DeleteMapping("/expenses/{id}/receipt")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        if (auth == null) {
            throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        }
        receiptService.delete(id, UUID.fromString(auth.getName()));
        return ResponseEntity.noContent().build();
    }
}
