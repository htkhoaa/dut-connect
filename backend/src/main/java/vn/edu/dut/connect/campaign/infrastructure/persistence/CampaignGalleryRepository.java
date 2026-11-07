package vn.edu.dut.connect.campaign.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.CampaignGalleryImage;

import java.util.List;
import java.util.UUID;

public interface CampaignGalleryRepository extends JpaRepository<CampaignGalleryImage, UUID> {
    List<CampaignGalleryImage> findByCampaignIdOrderBySortOrderAscCreatedAtDesc(UUID campaignId);
    List<CampaignGalleryImage> findByProposalIdOrderBySortOrderAscCreatedAtDesc(UUID proposalId);

    @Modifying
    @Transactional
    @Query("UPDATE CampaignGalleryImage g SET g.campaignId = :campaignId WHERE g.proposalId = :proposalId")
    void linkProposalImagesToCampaign(UUID proposalId, UUID campaignId);

    @Query("SELECT g.id, g.campaignId, g.contentType, g.caption, g.sortOrder, g.createdAt FROM CampaignGalleryImage g WHERE g.campaignId = :campaignId ORDER BY g.sortOrder ASC, g.createdAt DESC")
    List<Object[]> findMetadataByCampaignId(UUID campaignId);
}
