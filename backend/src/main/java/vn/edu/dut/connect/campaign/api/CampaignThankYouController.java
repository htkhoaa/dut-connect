package vn.edu.dut.connect.campaign.api;

import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.CampaignThankYouContracts.*;
import vn.edu.dut.connect.campaign.application.CampaignThankYouService;

@RestController
@RequestMapping("/api/v1")
public class CampaignThankYouController {
    private final CampaignThankYouService thankYouService;

    public CampaignThankYouController(CampaignThankYouService thankYouService) {
        this.thankYouService = thankYouService;
    }

    @GetMapping("/campaigns/{id}/thank-you/recipients")
    public CampaignRecipientsSummary recipients(
            @PathVariable UUID id,
            Authentication auth
    ) {
        if (auth == null) {
            throw new vn.edu.dut.connect.shared.application.ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        }
        UUID actorId = UUID.fromString(auth.getName());
        return thankYouService.recipientsSummary(id, actorId);
    }

    @PostMapping("/campaigns/{id}/thank-you")
    public CampaignThankYouResponse sendThankYou(
            @PathVariable UUID id,
            Authentication auth,
            @RequestBody(required = false) SendThankYouRequest request
    ) {
        if (auth == null) {
            throw new vn.edu.dut.connect.shared.application.ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Login required");
        }
        UUID actorId = UUID.fromString(auth.getName());
        return thankYouService.sendThankYou(id, actorId, request);
    }

    @GetMapping(value = "/campaigns/{id}/certificate/preview", produces = "image/svg+xml;charset=UTF-8")
    public ResponseEntity<String> previewCertificateSvg(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "DONATION") String type
    ) {
        String svg = thankYouService.previewCertificateSvg(id, type);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/svg+xml;charset=UTF-8"))
                .body(svg);
    }

    @GetMapping("/campaigns/{id}/certificate/preview-data")
    public Map<String, String> previewCertificateData(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "DONATION") String type
    ) {
        String svg = thankYouService.previewCertificateSvg(id, type);
        return Map.of("svg", svg, "type", type);
    }
}
