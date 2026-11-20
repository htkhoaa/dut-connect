package vn.edu.dut.connect.identity.api;

import java.io.IOException;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.identity.application.AvatarService;
import vn.edu.dut.connect.identity.application.IdentityContracts.UserSummary;
import vn.edu.dut.connect.shared.api.CurrentActor;

@RestController
@RequestMapping("/api/v1/me/avatar")
public class AvatarController {

    private final AvatarService service;

    public AvatarController(AvatarService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<byte[]> get(Authentication auth) {
        return service
            .get(CurrentActor.id(auth))
            .map(image ->
                ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .cacheControl(CacheControl.noStore())
                    .body(image)
            )
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserSummary upload(
        Authentication auth,
        @RequestParam MultipartFile image,
        @RequestParam long version
    ) throws IOException {
        return service.update(CurrentActor.id(auth), image.getBytes(), version);
    }

    @DeleteMapping
    public UserSummary delete(Authentication auth, @RequestParam long version) {
        return service.delete(CurrentActor.id(auth), version);
    }
}
