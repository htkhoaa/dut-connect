package vn.edu.dut.connect.donation.infrastructure.gateway;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.Set;
import com.fasterxml.jackson.databind.JsonNode;
import static vn.edu.dut.connect.donation.application.PaymentGateway.*;

/** Decodes authenticated provider responses without coercing invalid numbers or statuses. */
final class ZaloPayResponses {
    private static final int SUCCESS = 1, FAILURE = 2, PROCESSING = 3;
    private static final int DUPLICATE_ORDER = -68, EXPIRED_ORDER = -54;
    // These payment failures permit another payment attempt on the same unexpired provider order.
    private static final Set<Integer> RETRYABLE_PAYMENT_FAILURES = Set.of(
            -63, -217, -332, -333, -1330, -1331, -1332, -1333, -1340, -1341, -1342, -1343);

    private ZaloPayResponses() {}

    static CreationResult creation(JsonNode response) throws IOException {
        int status = integer(response, "return_code");
        String code = Integer.toString(status);
        if (status == SUCCESS) {
            if (!response.path("order_url").isTextual()) throw malformed();
            String url = response.path("order_url").textValue();
            try {
                URI uri = URI.create(url);
                if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || url.length() > 2000)
                    throw malformed();
            } catch (IllegalArgumentException e) { throw malformed(); }
            return new CreationResult(Outcome.PENDING, url, code, null);
        }
        if (status == FAILURE) {
            int subcode = integer(response, "sub_return_code");
            if (subcode != DUPLICATE_ORDER) return new CreationResult(Outcome.FAILED, null, code, "Provider rejected order");
        }
        return new CreationResult(Outcome.UNKNOWN, null, code, "Provider outcome unresolved");
    }

    static VerifiedResult query(String order, JsonNode response) throws IOException {
        int status = integer(response, "return_code");
        String code = Integer.toString(status);
        if (response.has("is_processing") && !response.path("is_processing").isBoolean()) throw malformed();
        if (status == SUCCESS) return paid(order, response, code);
        if (status == PROCESSING) return pending(order, code);
        if (status == FAILURE) {
            int subcode = integer(response, "sub_return_code");
            if (subcode == EXPIRED_ORDER && response.path("is_processing").isBoolean() && !response.path("is_processing").booleanValue())
                return new VerifiedResult("zalopay", order, Outcome.FAILED, null, null, null, "EXPIRED");
            if (RETRYABLE_PAYMENT_FAILURES.contains(subcode)) return pending(order, code);
        }
        // A failed query request is not an unpaid order: report unavailability and leave intent unchanged.
        throw new IOException("Provider query did not establish payment status");
    }

    static VerifiedResult paid(String order, JsonNode response, String code) throws IOException {
        long amount = positiveLong(response, "amount");
        long transaction = positiveLong(response, "zp_trans_id");
        long time = positiveLong(response, "server_time");
        return new VerifiedResult("zalopay", order, Outcome.PAID, BigDecimal.valueOf(amount), Long.toString(transaction), Instant.ofEpochMilli(time), code);
    }

    static int integer(JsonNode response, String field) throws IOException {
        JsonNode value = response.path(field);
        if (!value.isIntegralNumber() || !value.canConvertToInt()) throw malformed();
        return value.intValue();
    }

    private static long positiveLong(JsonNode response, String field) throws IOException {
        JsonNode value = response.path(field);
        if (!value.isIntegralNumber() || !value.canConvertToLong() || value.longValue() <= 0) throw malformed();
        return value.longValue();
    }

    private static VerifiedResult pending(String order, String code) {
        return new VerifiedResult("zalopay", order, Outcome.PENDING, null, null, null, code);
    }

    private static IOException malformed() { return new IOException("Malformed provider response"); }
}
