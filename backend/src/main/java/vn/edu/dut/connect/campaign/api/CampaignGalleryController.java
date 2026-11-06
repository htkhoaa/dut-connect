package vn.edu.dut.connect.campaign.api;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignGalleryImage;
import vn.edu.dut.connect.campaign.infrastructure.persistence.CampaignGalleryRepository;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class CampaignGalleryController {
    private final CampaignGalleryRepository repository;
    private final CampaignAccessPort campaigns;

    public CampaignGalleryController(CampaignGalleryRepository repository, CampaignAccessPort campaigns) {
        this.repository = repository;
        this.campaigns = campaigns;
    }

    public record GalleryItemDto(
            UUID id,
            UUID campaignId,
            String caption,
            int sortOrder,
            Instant createdAt,
            String imageUrl
    ) {}

    @GetMapping("/campaigns/{id}/gallery")
    public List<GalleryItemDto> list(@PathVariable UUID id) {
        return repository.findByCampaignIdOrderBySortOrderAscCreatedAtDesc(id).stream()
                .map(img -> new GalleryItemDto(
                        img.getId(),
                        img.getCampaignId(),
                        img.getCaption(),
                        img.getSortOrder(),
                        img.getCreatedAt(),
                        "/api/v1/campaigns/gallery/" + img.getId() + "/image"
                ))
                .toList();
    }

    @GetMapping("/campaigns/gallery/{imageId}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID imageId) {
        return repository.findById(imageId)
                .map(img -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(img.getContentType()))
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                        .body(img.getImageData()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/campaigns/{id}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GalleryItemDto upload(
            @PathVariable UUID id,
            Authentication auth,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "sortOrder", defaultValue = "0") int sortOrder
    ) throws IOException {
        if (auth == null) throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Authentication required");
        UUID actor = UUID.fromString(auth.getName());
        var campaign = campaigns.getCampaign(id);
        if (campaign == null) throw new ApplicationFailure(404, "NOT_FOUND", "Campaign not found");
        if (!campaigns.isManager(id, actor)) throw new ApplicationFailure(403, "ACCESS_DENIED", "Permission denied");

        if (file.isEmpty()) throw new ApplicationFailure(400, "VALIDATION_ERROR", "File cannot be empty");
        if (file.getSize() > 5 * 1024 * 1024) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Image size must be under 5MB");

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            contentType = "image/jpeg";
        }

        CampaignGalleryImage img = new CampaignGalleryImage(
                id,
                file.getBytes(),
                contentType,
                caption != null ? caption.trim() : "",
                sortOrder,
                actor
        );
        img = repository.save(img);

        return new GalleryItemDto(
                img.getId(),
                img.getCampaignId(),
                img.getCaption(),
                img.getSortOrder(),
                img.getCreatedAt(),
                "/api/v1/campaigns/gallery/" + img.getId() + "/image"
        );
    }

    @DeleteMapping("/campaigns/gallery/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable UUID imageId, Authentication auth) {
        if (auth == null) throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Authentication required");
        UUID actor = UUID.fromString(auth.getName());
        var img = repository.findById(imageId).orElseThrow(() -> new ApplicationFailure(404, "NOT_FOUND", "Image not found"));
        if (!campaigns.isManager(img.getCampaignId(), actor)) throw new ApplicationFailure(403, "ACCESS_DENIED", "Permission denied");

        repository.delete(img);
        return ResponseEntity.noContent().build();
    }
}
