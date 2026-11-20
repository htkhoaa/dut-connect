package vn.edu.dut.connect.campaign.application;

import java.util.UUID;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import vn.edu.dut.connect.shared.application.PageValidation;

public record CampaignQuery(
    int page,
    int size,
    String q,
    CampaignStatus status,
    UUID categoryId,
    ContributionMode contributionMode,
    UUID organizationId,
    String sort
) {
    public CampaignQuery {
        PageValidation.requireValid(page, size);
        if (q != null && q.indexOf('\0') >= 0) throw new ApplicationFailure(
            400,
            "VALIDATION_ERROR",
            "Search cannot contain null characters"
        );
        q = q == null ? "" : q.trim();
        if (q.length() > 200) throw new ApplicationFailure(
            400,
            "VALIDATION_ERROR",
            "Search must be at most 200 characters"
        );
        sort = sort == null || sort.isBlank() ? "newest" : sort;
        if (!java.util.Set.of("newest", "startDate").contains(sort)) throw new ApplicationFailure(
            400,
            "VALIDATION_ERROR",
            "Sort must be newest or startDate"
        );
    }
}
