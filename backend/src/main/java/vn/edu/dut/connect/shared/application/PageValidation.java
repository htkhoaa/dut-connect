package vn.edu.dut.connect.shared.application;

public final class PageValidation {

    private PageValidation() {}

    public static void requireValid(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApplicationFailure(
                400,
                "VALIDATION_ERROR",
                "Page must be nonnegative; size must be between 1 and 100"
            );
        }
    }
}
