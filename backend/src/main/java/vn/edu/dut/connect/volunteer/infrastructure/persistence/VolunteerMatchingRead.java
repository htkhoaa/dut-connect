package vn.edu.dut.connect.volunteer.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.volunteer.application.VolunteerMatchingPort;

@Repository
public class VolunteerMatchingRead implements VolunteerMatchingPort {
    private final JdbcClient jdbc;
    public VolunteerMatchingRead(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<Applicant> pending(UUID campaignId, List<UUID> applicationIds, int limit) {
        String sql = "select id as application_id,user_id,preferred_track,availability,version,updated_at from dut_connect.volunteer_registrations where campaign_id=:campaign and status='PENDING'";
        if (applicationIds != null) sql += " and id in (:ids)";
        var query = jdbc.sql(sql + " order by created_at desc,id limit :limit").param("campaign", campaignId).param("limit", limit);
        if (applicationIds != null) query.param("ids", applicationIds);
        return query.query(Applicant.class).list();
    }
}
