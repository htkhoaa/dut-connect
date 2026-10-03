package vn.edu.dut.connect.volunteer.domain;
public class VolunteerViolation extends RuntimeException {
    private final String code;
    private final String field;
    public VolunteerViolation(String code, String message, String field) { super(message); this.code=code; this.field=field; }
    public String code() { return code; }
    public String field() { return field; }
}
