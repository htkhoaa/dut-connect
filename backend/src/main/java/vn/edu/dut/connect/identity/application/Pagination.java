package vn.edu.dut.connect.identity.application;

import vn.edu.dut.connect.shared.application.ApplicationFailure;

public record Pagination(int page, int size) {
    public Pagination {
        if (page < 0 || size < 1 || size > 100)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Page must be nonnegative; size must be between 1 and 100");
    }
}
