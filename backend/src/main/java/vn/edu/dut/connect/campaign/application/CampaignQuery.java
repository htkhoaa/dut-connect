package vn.edu.dut.connect.campaign.application;
import java.util.UUID;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
public record CampaignQuery(int page, int size, String q, CampaignStatus status, UUID categoryId, ContributionMode contributionMode, UUID organizationId, String sort) {
    public CampaignQuery {
        if (page < 0 || size < 1 || size > 100) throw new ApplicationFailure(400,"VALIDATION_ERROR","Page must be nonnegative; size must be between 1 and 100");
        if (q != null && q.indexOf('\0') >= 0) throw new ApplicationFailure(400,"VALIDATION_ERROR","Search cannot contain null characters");
        q = q == null ? "" : q.trim();
        if (q.length() > 200) throw new ApplicationFailure(400,"VALIDATION_ERROR","Search must be at most 200 characters");
        sort = sort == null || sort.isBlank() ? "newest" : sort;
        if (!java.util.Set.of("newest","startDate").contains(sort)) throw new ApplicationFailure(400,"VALIDATION_ERROR","Sort must be newest or startDate");
    }
}
