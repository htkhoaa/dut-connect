package vn.edu.dut.connect.campaign.domain;
public class CampaignViolation extends RuntimeException {
    private final String code;
    private final String field;
    public CampaignViolation(String code, String message) { this(code, message, null); }
    public CampaignViolation(String code, String message, String field) {
        super(message); this.code = code; this.field = field;
    }
    public String code() { return code; }
    public String field() { return field; }
}
