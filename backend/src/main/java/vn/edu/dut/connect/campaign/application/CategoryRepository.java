package vn.edu.dut.connect.campaign.application;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
public interface CategoryRepository {
    Optional<CampaignCategory> find(UUID id);
    Optional<CampaignCategory> lock(UUID id);
    CampaignCategory save(CampaignCategory category);
    PageResult<CampaignCategory> list(CampaignQuery query, Visibility visibility);
    Map<UUID, CampaignCategory> findAll(Set<UUID> ids);
    void lockSlug(String slug);
    boolean slugExists(String slug);
    enum Visibility { ACTIVE, ALL }
}
