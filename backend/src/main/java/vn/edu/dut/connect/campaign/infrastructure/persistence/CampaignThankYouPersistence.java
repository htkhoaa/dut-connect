package vn.edu.dut.connect.campaign.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.campaign.application.CampaignThankYouContracts.ThankYouRecipientDto;
import vn.edu.dut.connect.campaign.application.CampaignThankYouRepository;

@Repository
public class CampaignThankYouPersistence implements CampaignThankYouRepository {

    private final JdbcClient jdbc;

    public CampaignThankYouPersistence(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<DonorRecord> donors(UUID campaignId) {
        return jdbc
            .sql(
                """
                select u.id as user_id, u.student_id, u.full_name, u.email, sum(d.amount) as total_amount
                from dut_connect.donations d
                join dut_connect.users u on u.id = d.donor_user_id
                where d.campaign_id = :id and d.status = 'PAID'
                group by u.id, u.student_id, u.full_name, u.email
                order by sum(d.amount) desc, u.full_name
                """
            )
            .param("id", campaignId)
            .query((rs, n) ->
                new DonorRecord(
                    rs.getObject("user_id", UUID.class),
                    rs.getString("student_id"),
                    rs.getString("full_name"),
                    rs.getString("email"),
                    rs.getBigDecimal("total_amount")
                )
            )
            .list();
    }

    public List<VolunteerRecord> volunteers(UUID campaignId) {
        return jdbc
            .sql(
                """
                select u.id as user_id, u.student_id, u.full_name, u.email,
                       coalesce(com.verified_hours, 0) as verified_hours
                from dut_connect.volunteer_registrations v
                join dut_connect.users u on u.id = v.user_id
                left join dut_connect.volunteer_completions com on com.campaign_id = v.campaign_id and com.user_id = v.user_id
                where v.campaign_id = :id and v.status = 'ACCEPTED' and com.status = 'VERIFIED'
                order by u.full_name
                """
            )
            .param("id", campaignId)
            .query((rs, n) ->
                new VolunteerRecord(
                    rs.getObject("user_id", UUID.class),
                    rs.getString("student_id"),
                    rs.getString("full_name"),
                    rs.getString("email"),
                    rs.getBigDecimal("verified_hours")
                )
            )
            .list();
    }

    public boolean claimDelivery(UUID campaignId, ThankYouRecipientDto recipient) {
        return jdbc
            .sql(
                """
                insert into dut_connect.campaign_thank_you_deliveries as delivery(campaign_id,user_id,contribution_type,status)
                values(:campaign,:user,:type,'SENDING')
                on conflict(campaign_id,user_id,contribution_type) do update
                set status='SENDING', error_code=null, updated_at=now()
                where delivery.status='FAILED'
                returning status
                """
            )
            .param("campaign", campaignId)
            .param("user", recipient.userId())
            .param("type", recipient.contributionType())
            .query(String.class)
            .optional()
            .isPresent();
    }

    public String deliveryStatus(UUID campaignId, ThankYouRecipientDto recipient) {
        return jdbc
            .sql(
                "select status from dut_connect.campaign_thank_you_deliveries where campaign_id=:campaign and user_id=:user and contribution_type=:type"
            )
            .param("campaign", campaignId)
            .param("user", recipient.userId())
            .param("type", recipient.contributionType())
            .query(String.class)
            .single();
    }

    public void markSent(UUID campaignId, ThankYouRecipientDto recipient) {
        jdbc.sql(
            "update dut_connect.campaign_thank_you_deliveries set status='SENT', error_code=null, sent_at=now(), updated_at=now() where campaign_id=:campaign and user_id=:user and contribution_type=:type"
        )
            .param("campaign", campaignId)
            .param("user", recipient.userId())
            .param("type", recipient.contributionType())
            .update();
    }

    public void markFailed(UUID campaignId, ThankYouRecipientDto recipient, String code) {
        jdbc.sql(
            "update dut_connect.campaign_thank_you_deliveries set status='FAILED', error_code=:code, updated_at=now() where campaign_id=:campaign and user_id=:user and contribution_type=:type"
        )
            .param("code", code)
            .param("campaign", campaignId)
            .param("user", recipient.userId())
            .param("type", recipient.contributionType())
            .update();
    }
}
