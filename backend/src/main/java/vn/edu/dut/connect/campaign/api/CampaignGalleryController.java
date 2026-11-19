package vn.edu.dut.connect.campaign.api;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.campaign.infrastructure.persistence.CampaignGalleryRepository;
import vn.edu.dut.connect.shared.api.UploadedFiles;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@RestController
@RequestMapping("/api/v1")
public class CampaignGalleryController {
    private final CampaignGalleryRepository repository;
    private final CampaignAccessPort campaigns;
    private final ProposalRepository proposals;
    private final CampaignAuthorization access;

    public CampaignGalleryController(CampaignGalleryRepository repository, CampaignAccessPort campaigns,
                                    ProposalRepository proposals, CampaignAuthorization access) {
        this.repository = repository;
        this.campaigns = campaigns;
        this.proposals = proposals;
        this.access = access;
    }

    public record GalleryItemDto(UUID id, UUID campaignId, String caption, int sortOrder,
                                 Instant createdAt, String imageUrl) {}

    @GetMapping("/campaigns/{id}/gallery")
    public List<GalleryItemDto> list(@PathVariable UUID id, Authentication auth) {
        visibleCampaign(id, actor(auth));
        return repository.campaignMetadata(id).stream().map(this::dto).toList();
    }

    @GetMapping("/proposals/{id}/gallery")
    public List<GalleryItemDto> listProposalGallery(@PathVariable UUID id, Authentication auth) {
        visibleProposal(id, actor(auth));
        return repository.proposalMetadata(id).stream().map(this::dto).toList();
    }

    @GetMapping("/campaigns/gallery/{imageId}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID imageId, Authentication auth) {
        var image = find(imageId);
        if (image.getCampaignId() != null) visibleCampaign(image.getCampaignId(), actor(auth));
        else visibleProposal(image.getProposalId(), actor(auth));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.noStore()).body(image.getImageData());
    }

    @PostMapping(value = "/proposals/{id}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GalleryItemDto uploadProposal(@PathVariable UUID id, Authentication auth,
            @RequestParam("file") MultipartFile file, @RequestParam(required = false) String caption,
            @RequestParam(defaultValue = "0") int sortOrder) throws IOException {
        UUID actor = requiredActor(auth);
        var proposal = proposals.find(id).orElseThrow(() -> ApplicationFailure.missing("Proposal not found"));
        if (!proposal.proposerId().equals(actor)) denied();
        if (proposal.status() == ProposalStatus.APPROVED || proposal.status() == ProposalStatus.CANCELLED)
            throw ApplicationFailure.conflict("Proposal no longer accepts image changes");
        return save(null, id, file, caption, sortOrder, actor);
    }

    @PostMapping(value = "/campaigns/{id}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GalleryItemDto upload(@PathVariable UUID id, Authentication auth,
            @RequestParam("file") MultipartFile file, @RequestParam(required = false) String caption,
            @RequestParam(defaultValue = "0") int sortOrder) throws IOException {
        UUID actor = requiredActor(auth);
        access.manager(id, actor);
        campaigns.getCampaign(id);
        return save(id, null, file, caption, sortOrder, actor);
    }

    @DeleteMapping("/campaigns/gallery/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable UUID imageId, Authentication auth) {
        UUID actor = requiredActor(auth);
        var image = find(imageId);
        if (image.getCampaignId() != null) access.manager(image.getCampaignId(), actor);
        else {
            var proposal = proposals.find(image.getProposalId()).orElseThrow(() -> ApplicationFailure.missing("Proposal not found"));
            if (!proposal.proposerId().equals(actor)) denied();
        }
        repository.delete(image);
        return ResponseEntity.noContent().build();
    }

    private GalleryItemDto save(UUID campaign, UUID proposal, MultipartFile file, String caption,
                                int sortOrder, UUID actor) throws IOException {
        if (caption != null && caption.trim().length() > 300)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Caption must not exceed 300 characters");
        var uploaded = UploadedFiles.image(file);
        var image = repository.save(new CampaignGalleryImage(campaign, proposal, uploaded.bytes(),
                uploaded.contentType(), caption == null ? "" : caption.trim(), sortOrder, actor));
        return new GalleryItemDto(image.getId(), campaign == null ? proposal : campaign, image.getCaption(),
                image.getSortOrder(), image.getCreatedAt(), imageUrl(image.getId()));
    }

    private void visibleCampaign(UUID id, UUID actor) {
        var campaign = campaigns.getCampaign(id);
        if (campaign.status() == CampaignStatus.DRAFT && (actor == null
                || (!access.active(actor).admin() && !campaigns.isManager(id, actor))))
            throw ApplicationFailure.missing("Campaign not found");
    }

    private void visibleProposal(UUID id, UUID actor) {
        var proposal = proposals.find(id).orElseThrow(() -> ApplicationFailure.missing("Proposal not found"));
        if (actor == null || (!access.active(actor).admin() && !proposal.proposerId().equals(actor)))
            throw ApplicationFailure.missing("Proposal not found");
    }

    private CampaignGalleryImage find(UUID id) {
        return repository.findById(id).orElseThrow(() -> ApplicationFailure.missing("Image not found"));
    }
    private GalleryItemDto dto(CampaignGalleryRepository.Metadata image) {
        return new GalleryItemDto(image.getId(), image.getCampaignId() == null ? image.getProposalId() : image.getCampaignId(),
                image.getCaption(), image.getSortOrder(), image.getCreatedAt(), imageUrl(image.getId()));
    }
    private String imageUrl(UUID id) { return "/api/v1/campaigns/gallery/" + id + "/image"; }
    private UUID actor(Authentication auth) { return auth == null ? null : UUID.fromString(auth.getName()); }
    private UUID requiredActor(Authentication auth) {
        UUID actor = actor(auth);
        if (actor == null) throw new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        return actor;
    }
    private void denied() { throw new ApplicationFailure(403, "ACCESS_DENIED", "Gallery permission required"); }
}
