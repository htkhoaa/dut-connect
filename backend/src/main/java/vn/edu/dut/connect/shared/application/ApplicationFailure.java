package vn.edu.dut.connect.shared.application;

public class ApplicationFailure extends RuntimeException {
    private final int status;
    private final String code;

    public ApplicationFailure(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public static ApplicationFailure conflict(String message) {
        return new ApplicationFailure(409, "CONFLICT", message);
    }

    public static ApplicationFailure missing(String message) {
        return new ApplicationFailure(404, "RESOURCE_NOT_FOUND", message);
    }
}
