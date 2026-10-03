package vn.edu.dut.connect.donation.infrastructure.gateway;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

final class PaymentMac {
    private PaymentMac() {
    }

    static String sign(String data, String key) {
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException("Payment signature algorithm unavailable", e);
        }
    }

    static boolean valid(String data, String supplied, String key) {
        if (data == null || supplied == null || !supplied.matches("[0-9a-fA-F]{64}")) return false;
        return MessageDigest.isEqual(HexFormat.of().parseHex(sign(data, key)), HexFormat.of().parseHex(supplied));
    }
}
