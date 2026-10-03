package vn.edu.dut.connect.organization.domain;
public class OrganizationRuleViolation extends RuntimeException {
    private final String code;
    public OrganizationRuleViolation(String code, String message) {
        super(message);
        this.code = code;
    }
    public String code() {
        return code;
    }
}
