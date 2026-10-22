package vn.edu.dut.connect.donation.infrastructure.gateway;

import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;

import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.donation.application.PaymentGateway;
import vn.edu.dut.connect.donation.infrastructure.PaymentSettings;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class ZaloPaySandboxPaymentGateway implements PaymentGateway {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ZaloPaySandboxPaymentGateway.class);
    private final PaymentSettings settings;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).followRedirects(HttpClient.Redirect.NEVER).build();

    public ZaloPaySandboxPaymentGateway(PaymentSettings settings, ObjectMapper json) {
        this.settings = settings;
        this.json = json;
    }

    public String provider() {
        return "zalopay";
    }

    public void requireAvailable() {
        try {
            requireCredentials("key1", "key2");
            endpoint("create-order-url");
            endpoint("query-order-url");
            var callback = URI.create(settings.zalopay("callback-url"));
            var redirect = URI.create(settings.zalopay("redirect-url"));
            if (!"https".equals(callback.getScheme()) || callback.getHost() == null || callback.getUserInfo() != null || callback.getFragment() != null || callback.getQuery() != null || !callback.getPath().equals("/api/v1/payments/zalopay/callback"))
                throw new IllegalArgumentException();
            if (!Set.of("http", "https").contains(redirect.getScheme()) || redirect.getHost() == null || redirect.getUserInfo() != null || redirect.getFragment() != null || !"/payment/result".equals(redirect.getPath()))
                throw new IllegalArgumentException();
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "Configure ZaloPay sandbox credentials and valid provider/callback/redirect URLs");
        }
    }

    private void requireCredentials(String... keys) {
        try {
            if (Integer.parseInt(settings.zalopay("app-id")) <= 0) throw new IllegalArgumentException();
            for (String key : keys) if (settings.zalopay(key).isBlank()) throw new IllegalArgumentException();
        } catch (IllegalArgumentException e) {
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "Required ZaloPay merchant credentials are unavailable");
        }
    }

    private URI endpoint(String name) {
        var uri = URI.create(settings.zalopay(name));
        if (!"https".equals(uri.getScheme()) || !"sb-openapi.zalopay.vn".equals(uri.getHost()) || uri.getPort() != -1 && uri.getPort() != 443 || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null || !uri.getPath().equals(name.equals("create-order-url") ? "/v2/create" : "/v2/query"))
            throw new IllegalArgumentException();
        return uri;
    }

    public CreationResult createPayment(CreationCommand c) {
        requireAvailable();
        try {
            String app = Integer.toString(Integer.parseInt(settings.zalopay("app-id"))), user = "DUTConnect", time = Long.toString(c.createdAt().toEpochMilli()), amount = c.amount().toPlainString();
            String redirect = org.springframework.web.util.UriComponentsBuilder.fromUriString(settings.zalopay("redirect-url")).replaceQueryParam("donationId", c.donationId()).build().toUriString();
            String embed = json.writeValueAsString(Map.of("redirecturl", redirect)), item = "[]";
            var body = new LinkedHashMap<String, String>();
            body.put("app_id", app);
            body.put("app_trans_id", c.orderId());
            body.put("app_user", user);
            body.put("app_time", time);
            body.put("amount", amount);
            body.put("embed_data", embed);
            body.put("item", item);
            body.put("description", "DUT Connect campaign donation");
            body.put("callback_url", settings.zalopay("callback-url"));
            body.put("expire_duration_seconds", Long.toString(Duration.between(c.createdAt(), c.expiresAt()).toSeconds()));
            body.put("mac", PaymentMac.sign(String.join("|", app, c.orderId(), user, amount, time, embed, item), settings.zalopay("key1")));
            return ZaloPayResponses.creation(post(endpoint("create-order-url"), body));
        } catch (java.io.IOException | IllegalArgumentException e) {
            log.warn("ZaloPay order creation unresolved payment={} failureType={}", c.paymentId(), e.getClass().getSimpleName());
            return unknown();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return unknown();
        }
    }

    public VerifiedResult verifyCallback(Callback c) {
        requireCredentials("key2");
        if (c == null || !Integer.valueOf(1).equals(c.type()) || !PaymentMac.valid(c.data(), c.mac(), settings.zalopay("key2")))
            throw invalid();
        try {
            var d = json.readTree(c.data());
            if (d == null || !d.isObject() || ZaloPayResponses.integer(d, "app_id") != Integer.parseInt(settings.zalopay("app-id")) || !d.path("app_trans_id").isTextual() || d.path("app_trans_id").textValue().isBlank())
                throw invalid();
            return ZaloPayResponses.paid(d.path("app_trans_id").textValue(), d, "CALLBACK");
        } catch (java.io.IOException | IllegalArgumentException e) {
            throw invalid();
        }
    }

    public VerifiedResult query(String order) {
        requireCredentials("key1");
        try {
            String app = Integer.toString(Integer.parseInt(settings.zalopay("app-id"))), key = settings.zalopay("key1");
            var r = post(endpoint("query-order-url"), Map.of("app_id", app, "app_trans_id", order, "mac", PaymentMac.sign(app + "|" + order + "|" + key, key)));
            return ZaloPayResponses.query(order, r);
        } catch (java.io.IOException | IllegalArgumentException e) {
            log.warn("ZaloPay query unavailable order={} failureType={}", order, e.getClass().getSimpleName());
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "Provider status is unavailable; payment remains unresolved");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApplicationFailure(503, "PAYMENT_PROVIDER_ERROR", "Provider status is unavailable");
        }
    }

    private JsonNode post(URI uri, Map<String, String> fields) throws java.io.IOException, InterruptedException {
        String body = fields.entrySet().stream().map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8)).collect(java.util.stream.Collectors.joining("&"));
        var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(6)).header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body)).build();
        var response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200 || response.body().length() > 65536)
            throw new java.io.IOException("Invalid provider response");
        var result = json.readTree(response.body());
        if (result == null || !result.isObject() || !result.path("return_code").isIntegralNumber() || !result.path("return_code").canConvertToInt())
            throw new java.io.IOException("Malformed provider response");
        return result;
    }

    private static CreationResult unknown() {
        return new CreationResult(Outcome.UNKNOWN, null, null, "Provider outcome unresolved");
    }

    private static ApplicationFailure invalid() {
        return new ApplicationFailure(400, "PAYMENT_VERIFICATION_FAILED", "Invalid ZaloPay provider data");
    }
}
