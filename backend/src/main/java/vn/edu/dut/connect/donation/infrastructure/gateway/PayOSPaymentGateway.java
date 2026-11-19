package vn.edu.dut.connect.donation.infrastructure.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.donation.application.PaymentGateway;
import vn.edu.dut.connect.donation.infrastructure.PaymentSettings;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Component
public class PayOSPaymentGateway implements PaymentGateway {
    private static final Logger log = LoggerFactory.getLogger(PayOSPaymentGateway.class);
    private static final String PAYOS_API = "https://api-merchant.payos.vn/v2/payment-requests";
    private final PaymentSettings settings;
    private final ObjectMapper json;
    private final HttpClient http;

    public PayOSPaymentGateway(PaymentSettings settings, ObjectMapper json) {
        this.settings = settings;
        this.json = json;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public String provider() {
        return "payos";
    }

    @Override
    public void requireAvailable() {
        if (settings.payos("client-id").isBlank() || settings.payos("api-key").isBlank()
                || settings.payos("checksum-key").isBlank()) {
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "PayOS is not configured");
        }
    }

    @Override
    public CreationResult createPayment(CreationCommand command) {
        requireAvailable();
        String clientId = settings.payos("client-id");
        String apiKey = settings.payos("api-key");
        String checksumKey = settings.payos("checksum-key");

        // Format orderCode: numeric positive integer fits PayOS requirement (< 9007199254740991)
        long orderCode;
        try {
            orderCode = Long.parseLong(command.orderId());
        } catch (Exception e) {
            orderCode = Math.abs(command.orderId().hashCode() % 1_000_000_000L) + (System.currentTimeMillis() % 1_000_000L);
        }
        // VietQR standard memo: max 25 alphanumeric chars
        String description = "DUT " + orderCode;

        try {
            int amount = command.amount().intValueExact();
            String frontendUrl = System.getenv().getOrDefault("APP_FRONTEND_URL", "https://dutconnect.vercel.app");
            if (frontendUrl.endsWith("/")) {
                frontendUrl = frontendUrl.substring(0, frontendUrl.length() - 1);
            }
            String returnUrl = frontendUrl + "/payment/result?donationId=" + command.donationId();
            String cancelUrl = frontendUrl + "/payment/result?donationId=" + command.donationId();

            // PayOS signature: 5 mandatory sorted keys (amount, cancelUrl, description, orderCode, returnUrl)
            String dataToSign = "amount=" + amount + "&cancelUrl=" + cancelUrl + "&description=" + description + "&orderCode=" + orderCode + "&returnUrl=" + returnUrl;
            String signature = PaymentMac.sign(dataToSign, checksumKey);

            Map<String, Object> reqBody = new LinkedHashMap<>();
            reqBody.put("orderCode", orderCode);
            reqBody.put("amount", amount);
            reqBody.put("description", description);
            reqBody.put("returnUrl", returnUrl);
            reqBody.put("cancelUrl", cancelUrl);
            reqBody.put("signature", signature);
            reqBody.put("expiredAt", command.expiresAt().getEpochSecond());

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(PAYOS_API))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(reqBody)))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("PayOS createPayment response status={}", resp.statusCode());
            JsonNode root = json.readTree(resp.body());
            if ("00".equals(root.path("code").asText())) {
                JsonNode data = root.path("data");
                String checkoutUrl = data.path("checkoutUrl").asText();
                String qrCode = data.path("qrCode").asText("");
                String accountNumber = data.path("accountNumber").asText("");
                String accountName = data.path("accountName").asText("");
                String bin = data.path("bin").asText("");
                log.info("PayOS order created orderCode={} qrCodeLength={} account={}", orderCode, qrCode.length(), accountNumber);
                return new CreationResult(Outcome.PENDING, checkoutUrl, "00", "PayOS order created", qrCode, accountNumber, accountName, bin);
            } else {
                log.warn("PayOS order creation failed: {}", resp.body());
                return new CreationResult(Outcome.FAILED, null, root.path("code").asText(), root.path("desc").asText());
            }
        } catch (Exception e) {
            log.error("PayOS creation error", e);
            return new CreationResult(Outcome.UNKNOWN, null, "500", "Chưa xác định được trạng thái tạo thanh toán. Vui lòng kiểm tra lại.");
        }
    }

    @Override
    public VerifiedResult verifyCallback(Callback callback) {
        try {
            JsonNode payload = json.readTree(callback.data());
            JsonNode data = payload.path("data");
            String key = settings.payos("checksum-key");
            if (key.isBlank() || !data.isObject()
                    || !PaymentMac.valid(signatureData(data), payload.path("signature").asText(), key)) {
                throw new IllegalArgumentException("Invalid webhook signature");
            }
            if (!"00".equals(data.path("code").asText()) || !"VND".equals(data.path("currency").asText())
                    || !data.path("amount").isIntegralNumber() || !data.path("orderCode").isIntegralNumber()) {
                throw new IllegalArgumentException("Invalid payment result");
            }

            long amountVal = data.has("amount") ? data.path("amount").asLong(0) : payload.path("amount").asLong(0);
            String desc = data.has("description") ? data.path("description").asText("") : payload.path("description").asText("");
            long orderCode = data.has("orderCode") ? data.path("orderCode").asLong(0) : payload.path("orderCode").asLong(0);
            String reference = data.has("reference") ? data.path("reference").asText("") : payload.path("reference").asText("");
            if (reference.isBlank()) {
                throw new IllegalArgumentException("Payment reference is required");
            }

            String orderId = orderCode > 0 ? String.valueOf(orderCode) : "";
            if (orderId.isBlank()) {
                throw new IllegalArgumentException("Order code is required");
            }

            log.info("PayOS verifyCallback: orderCode={} desc={} resolvedOrderId={} amount={}", orderCode, desc, orderId, amountVal);

            return new VerifiedResult("payos", orderId, Outcome.PAID,
                    BigDecimal.valueOf(amountVal), reference, Instant.now(), "00");
        } catch (Exception e) {
            log.warn("PayOS callback rejected: {}", e.getClass().getSimpleName());
            throw new ApplicationFailure(400, "PAYMENT_VERIFICATION_FAILED", "Invalid PayOS callback data");
        }
    }

    // payOS signs the fields inside data, sorted by field name (not the outer JSON).
    static String signatureData(JsonNode data) {
        var fields = new TreeMap<String, String>();
        data.fields().forEachRemaining(field -> {
            JsonNode value = field.getValue();
            if (value.isContainerNode()) throw new IllegalArgumentException("Unexpected webhook field");
            String text = value.isNull() ? "" : value.asText();
            fields.put(field.getKey(), Set.of("null", "undefined").contains(text) ? "" : text);
        });
        return fields.entrySet().stream().map(e -> e.getKey() + "=" + e.getValue())
                .collect(java.util.stream.Collectors.joining("&"));
    }

    @Override
    public VerifiedResult query(String orderId) {
        String clientId = settings.payos("client-id");
        String apiKey = settings.payos("api-key");
        if (clientId.isBlank() || apiKey.isBlank()) {
            return new VerifiedResult("payos", orderId, Outcome.PENDING, BigDecimal.ZERO, null, null, "PENDING");
        }
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(PAYOS_API + "/" + orderId))
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            log.debug("PayOS query orderId={} status={}", orderId, resp.statusCode());
            JsonNode root = json.readTree(resp.body());
            if ("00".equals(root.path("code").asText())) {
                JsonNode data = root.path("data");
                String status = data.path("status").asText();
                long amount = data.path("amount").asLong(0);
                long amountPaid = data.path("amountPaid").asLong(0);
                String transactionId = "TX-" + orderId;
                if (data.has("transactions") && data.path("transactions").isArray() && !data.path("transactions").isEmpty()) {
                    transactionId = data.path("transactions").get(0).path("reference").asText(transactionId);
                }

                if ("PAID".equalsIgnoreCase(status) || (amount > 0 && amountPaid >= amount)) {
                    return new VerifiedResult("payos", orderId, Outcome.PAID,
                            BigDecimal.valueOf(amountPaid > 0 ? amountPaid : amount),
                            transactionId, Instant.now(), "00");
                } else if ("CANCELLED".equalsIgnoreCase(status)) {
                    return new VerifiedResult("payos", orderId, Outcome.CANCELLED, BigDecimal.ZERO, null, null, "CANCELLED");
                }
            }
        } catch (Exception e) {
            log.error("PayOS query failed orderId={}", orderId, e);
        }
        return new VerifiedResult("payos", orderId, Outcome.PENDING, BigDecimal.ZERO, null, null, "PENDING");
    }
}
