package vn.edu.dut.connect.organization.application;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
public record OrganizationQuery(int page, int size, String q) {
    public OrganizationQuery {
        if (page<0 || size<1 || size>100) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Page must be nonnegative; size must be between 1 and 100");
        q=q==null?"":q.trim();
        if (q.length()>200) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Search must be at most 200 characters");
    }
}
