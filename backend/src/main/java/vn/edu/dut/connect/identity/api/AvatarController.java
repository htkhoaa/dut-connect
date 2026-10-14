package vn.edu.dut.connect.identity.api;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.identity.application.AvatarService;
import vn.edu.dut.connect.identity.application.IdentityContracts.UserSummary;

@RestController
@RequestMapping("/api/v1/me/avatar")
public class AvatarController {
    private final AvatarService service;
    public AvatarController(AvatarService service) {this.service = service;}
    @GetMapping
    public ResponseEntity<byte[]> get(Authentication auth) {
        return service.get(UUID.fromString(auth.getName())).map(image -> ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noStore()).body(image))
            .orElseGet(() -> ResponseEntity.noContent().build());
    }
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserSummary upload(Authentication auth, @RequestParam MultipartFile image, @RequestParam long version) throws IOException {
        return service.update(UUID.fromString(auth.getName()), image.getBytes(), version);
    }
    @DeleteMapping
    public UserSummary delete(Authentication auth, @RequestParam long version) {
        return service.delete(UUID.fromString(auth.getName()), version);
    }
}
