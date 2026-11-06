package vn.edu.dut.connect.campaign.api;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/campaigns/{campaignId}/activities")
public class CampaignActivityController {
    private final JdbcClient jdbc;

    public CampaignActivityController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record CampaignActivity(
            String id,
            String type, // DONATION, VOLUNTEER, MILESTONE
            String title,
            String description,
            BigDecimal amount,
            Instant timestamp
    ) {}

    @GetMapping
    public List<CampaignActivity> getRecentActivities(@PathVariable UUID campaignId) {
        List<CampaignActivity> list = new ArrayList<>();

        // Recent paid donations
        try {
            var donations = jdbc.sql("""
                select d.id, d.amount, d.created_at, u.full_name
                from dut_connect.donations d
                left join dut_connect.users u on d.donor_user_id = u.id
                where d.campaign_id = :campaignId and d.status = 'PAID'
                order by d.created_at desc
                limit 10
            """).param("campaignId", campaignId)
            .query((rs, rowNum) -> {
                String fullName = rs.getString("full_name");
                String masked = maskName(fullName);
                BigDecimal amt = rs.getBigDecimal("amount");
                Instant time = rs.getTimestamp("created_at").toInstant();
                return new CampaignActivity(
                        rs.getString("id"),
                        "DONATION",
                        masked + " đã ủng hộ",
                        "Khoản tiếp sức: " + formatVnd(amt),
                        amt,
                        time
                );
            }).list();
            list.addAll(donations);
        } catch (Exception ignored) {}

        // Recent volunteer registrations
        try {
            var volunteers = jdbc.sql("""
                select v.id, v.created_at, u.full_name, v.preferred_track
                from dut_connect.volunteer_registrations v
                left join dut_connect.users u on v.user_id = u.id
                where v.campaign_id = :campaignId
                order v.created_at desc
                limit 10
            """).param("campaignId", campaignId)
            .query((rs, rowNum) -> {
                String fullName = rs.getString("full_name");
                String masked = maskName(fullName);
                Instant time = rs.getTimestamp("created_at").toInstant();
                String track = "TECHNICAL".equalsIgnoreCase(rs.getString("preferred_track")) ? "Kỹ thuật" : "Hậu cần";
                return new CampaignActivity(
                        rs.getString("id"),
                        "VOLUNTEER",
                        masked + " vừa đăng ký tình nguyện",
                        "Vị trí quan tâm: " + track,
                        null,
                        time
                );
            }).list();
            list.addAll(volunteers);
        } catch (Exception ignored) {}

        // Sort combined list by timestamp descending
        list.sort((a, b) -> b.timestamp().compareTo(a.timestamp()));
        if (list.size() > 15) {
            return list.subList(0, 15);
        }
        return list;
    }

    private static String maskName(String name) {
        if (name == null || name.isBlank()) return "Một bạn sinh viên DUT";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) return parts[0].charAt(0) + "***";
        return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }

    private static String formatVnd(BigDecimal amt) {
        if (amt == null) return "0 đ";
        return String.format(Locale.GERMANY, "%,d đ", amt.longValue());
    }
}
