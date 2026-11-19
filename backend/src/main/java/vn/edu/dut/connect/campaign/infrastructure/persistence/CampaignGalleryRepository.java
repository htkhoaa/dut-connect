package vn.edu.dut.connect.campaign.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.CampaignGalleryImage;

import java.util.List;
import java.util.UUID;

public interface CampaignGalleryRepository extends JpaRepository<CampaignGalleryImage, UUID> {
    interface Metadata {
        UUID getId();
        UUID getCampaignId();
        UUID getProposalId();
        String getCaption();
        int getSortOrder();
        java.time.Instant getCreatedAt();
    }

    // The list screen needs metadata only, not every image's byte array.
    @Query("SELECT g.id as id, g.campaignId as campaignId, g.proposalId as proposalId, g.caption as caption, g.sortOrder as sortOrder, g.createdAt as createdAt FROM CampaignGalleryImage g WHERE g.campaignId=:id ORDER BY g.sortOrder, g.createdAt DESC, g.id")
    List<Metadata> campaignMetadata(UUID id);

    @Query("SELECT g.id as id, g.campaignId as campaignId, g.proposalId as proposalId, g.caption as caption, g.sortOrder as sortOrder, g.createdAt as createdAt FROM CampaignGalleryImage g WHERE g.proposalId=:id ORDER BY g.sortOrder, g.createdAt DESC, g.id")
    List<Metadata> proposalMetadata(UUID id);

    @Modifying
    @Transactional
    @Query("UPDATE CampaignGalleryImage g SET g.campaignId = :campaignId WHERE g.proposalId = :proposalId")
    void linkProposalImagesToCampaign(UUID proposalId, UUID campaignId);

}
