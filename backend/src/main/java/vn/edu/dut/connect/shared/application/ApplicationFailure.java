package vn.edu.dut.connect.shared.application;

import vn.edu.dut.connect.shared.api.ErrorCode;

public class ApplicationFailure extends RuntimeException {
    private final int status;
    private final String code;

    public ApplicationFailure(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public ApplicationFailure(ErrorCode errorCode) {
        this(errorCode.statusCode(), errorCode.code(), errorCode.defaultMessage());
    }

    public ApplicationFailure(ErrorCode errorCode, String message) {
        this(errorCode.statusCode(), errorCode.code(), message);
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public static ApplicationFailure conflict(String message) {
        return new ApplicationFailure(ErrorCode.CONFLICT, message);
    }

    public static ApplicationFailure missing(String message) {
        return new ApplicationFailure(ErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
