package vn.edu.dut.connect.donation.domain;

public class PaymentViolation extends RuntimeException {
    private final String code, field;

    public PaymentViolation(String code, String message, String field) {
        super(message);
        this.code = code;
        this.field = field;
    }

    public String code() {
        return code;
    }

    public String field() {
        return field;
    }
}
