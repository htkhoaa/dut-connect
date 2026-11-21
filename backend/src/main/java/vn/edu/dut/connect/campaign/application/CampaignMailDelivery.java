package vn.edu.dut.connect.campaign.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.shared.application.EmailNotificationService;

/** Keeps recipient selection and delivery tracking in Java; only SMTP runs on Vercel. */
@Service
public class CampaignMailDelivery {

    private final EmailNotificationService smtp;
    private final IdentityDirectoryPort identities;
    private final JwtEncoder encoder;
    private final ObjectMapper json;
    private final String relayUrl;
    private final RestClient http;

    public CampaignMailDelivery(
        EmailNotificationService smtp,
        IdentityDirectoryPort identities,
        JwtEncoder encoder,
        ObjectMapper json,
        @Value("${app.mail.campaign-relay-url:}") String relayUrl
    ) {
        this.smtp = smtp;
        this.identities = identities;
        this.encoder = encoder;
        this.json = json;
        this.relayUrl = relayUrl;
        var requests = new SimpleClientHttpRequestFactory();
        requests.setConnectTimeout(5000);
        requests.setReadTimeout(25000);
        this.http = RestClient.builder().requestFactory(requests).build();
    }

    public boolean available() {
        return !relayUrl.isBlank() || smtp.available();
    }

    public void send(
        UUID actorId,
        String recipient,
        String subject,
        String html,
        String attachmentName,
        byte[] image,
        String contentType
    ) {
        if (relayUrl.isBlank()) {
            smtp.sendWithImageAttachment(
                recipient,
                subject,
                html,
                attachmentName,
                image,
                contentType
            );
            return;
        }
        var actor = identities
            .findAccount(actorId)
            .filter(IdentityDirectoryPort.Account::active)
            .orElseThrow(() -> new ApplicationFailure(403, "ACCESS_DENIED", "Account unavailable"));
        try {
            byte[] payload = json.writeValueAsBytes(
                Map.of(
                    "recipient",
                    recipient,
                    "subject",
                    subject,
                    "html",
                    html,
                    "attachmentName",
                    attachmentName,
                    "attachment",
                    Base64.getEncoder().encodeToString(image),
                    "contentType",
                    contentType
                )
            );
            String digest = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(payload)
            );
            Instant now = Instant.now();
            var claims = JwtClaimsSet.builder()
                .issuer("dut-connect")
                .subject(actorId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .id(UUID.randomUUID().toString())
                .claim("role", "USER")
                .claim("email", actor.email())
                .claim("purpose", "campaign-mail-relay")
                .claim("mailHash", digest)
                .build();
            String token = encoder
                .encode(
                    JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)
                )
                .getTokenValue();
            var response = http
                .post()
                .uri(relayUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .body(Map.of("payload", Base64.getEncoder().encodeToString(payload)))
                .retrieve()
                .body(RelayResponse.class);
            if (response == null || !response.accepted()) {
                String code = response == null ? "MAIL_DELIVERY_FAILED" : response.code();
                if (
                    !List.of(
                        "MAIL_UNAVAILABLE",
                        "MAIL_AUTHENTICATION_FAILED",
                        "MAIL_CONNECTION_FAILED",
                        "MAIL_DELIVERY_FAILED"
                    ).contains(code)
                ) code = "MAIL_DELIVERY_FAILED";
                throw new ApplicationFailure(502, code, "Mail relay did not accept the message");
            }
        } catch (ApplicationFailure failure) {
            throw failure;
        } catch (Exception failure) {
            throw new ApplicationFailure(
                502,
                "MAIL_DELIVERY_FAILED",
                "Mail relay could not be reached"
            );
        }
    }

    private record RelayResponse(boolean accepted, String code) {}
}
