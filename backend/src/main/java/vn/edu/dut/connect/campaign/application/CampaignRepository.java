package vn.edu.dut.connect.campaign.application;
import java.util.*;
import java.time.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import static vn.edu.dut.connect.campaign.application.CampaignContracts.*;
public interface CampaignRepository {
    enum Visibility { PUBLIC, ALL }
    Optional<Campaign> find(UUID id);
    List<Campaign> findAll(Set<UUID> ids);
    Optional<Campaign> bySlug(String slug);
    Optional<Campaign> byProposal(UUID proposalId);
    Optional<Campaign> lock(UUID id);
    Campaign save(Campaign campaign);
    PageResult<Campaign> list(CampaignQuery query, UUID manager, Visibility visibility);
    Set<UUID> managedCampaigns(Set<UUID> ids,UUID userId);
    Optional<ManagerRole> role(UUID campaignId, UUID userId);
    void addManager(UUID campaignId, UUID userId, ManagerRole role);
    void removeManager(UUID campaignId, UUID userId);
    PageResult<ManagerMembership> managers(UUID campaignId, CampaignQuery query);
    List<Requirement> skills(UUID campaignId);
    void replaceSkills(UUID campaignId, List<Requirement> items);
    void lockSlug(String slug);
    boolean slugExists(String slug);
}
