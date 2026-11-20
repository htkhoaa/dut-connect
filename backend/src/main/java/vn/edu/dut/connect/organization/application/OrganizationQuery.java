package vn.edu.dut.connect.organization.application;

import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.shared.application.PageValidation;

public record OrganizationQuery(int page, int size, String q) {
    public OrganizationQuery {
        PageValidation.requireValid(page, size);
        q = q == null ? "" : q.trim();
        if (q.length() > 200) throw new ApplicationFailure(
            400,
            "VALIDATION_ERROR",
            "Search must be at most 200 characters"
        );
    }
}
