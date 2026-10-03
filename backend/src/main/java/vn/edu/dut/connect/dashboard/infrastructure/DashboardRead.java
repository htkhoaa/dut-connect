package vn.edu.dut.connect.dashboard.infrastructure;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.dashboard.application.DashboardQuery;

/** Dedicated read projections may join module tables; no aggregate mutations. */
@Repository
public class DashboardRead implements DashboardQuery {
    private final JdbcClient jdbc;
    public DashboardRead(JdbcClient jdbc) { this.jdbc = jdbc; }
    public Admin admin() {
        return new Admin(count("campaigns", "status='ACTIVE'"), count("campaigns", "status='COMPLETED'"),
            count("proposals", "status='PENDING'"), count("organizations", "status='PENDING_VERIFICATION'"),
            count("organizations", "status='VERIFIED'"),
            jdbc.sql("select count(distinct user_id) from dut_connect.volunteer_registrations where status='ACCEPTED'").query(Long.class).single(),
            sum("volunteer_completions", "verified_hours", "status='VERIFIED'"), sum("donations", "amount", "status='PAID'"),
            count("campaigns", "status in ('OPEN','ACTIVE') and contribution_mode in ('DONATION_ONLY','HYBRID') and (fundraising_deadline is null or fundraising_deadline>=CURRENT_TIMESTAMP)"),
            count("campaign_expenses", "status='PENDING'"));
    }
    public Campaign campaign(UUID id) {
        var applications = groups("volunteer_registrations", "status", id, "", List.of("PENDING", "ACCEPTED", "REJECTED", "CANCELLED"));
        applications.put("TOTAL", applications.values().stream().mapToLong(Long::longValue).sum());
        return new Campaign(Map.copyOf(applications), Map.copyOf(groups("volunteer_registrations", "assigned_track", id, "and status='ACCEPTED'", List.of("TECHNICAL", "LOGISTICS"))),
            Map.copyOf(groups("volunteer_tasks", "status", id, "", List.of("TODO", "IN_PROGRESS", "DONE", "VERIFIED"))),
            campaignCount("attendance_sessions", id, ""), campaignCount("volunteer_completions", id, "and status='VERIFIED'"),
            jdbc.sql("select coalesce(sum(verified_hours),0)::text from dut_connect.volunteer_completions where campaign_id=:id and status='VERIFIED'").param("id", id).query(String.class).single(),
            campaignCount("campaign_expenses", id, "and status='PENDING'"));
    }
    // Identifiers and predicates below are internal constants, never request input.
    private long count(String table, String condition) {
        return jdbc.sql("select count(*) from dut_connect." + table + " where " + condition).query(Long.class).single();
    }
    private String sum(String table, String column, String condition) {
        return jdbc.sql("select coalesce(sum(" + column + "),0)::text from dut_connect." + table + " where " + condition).query(String.class).single();
    }
    private long campaignCount(String table, UUID id, String condition) {
        return jdbc.sql("select count(*) from dut_connect." + table + " where campaign_id=:id " + condition).param("id", id).query(Long.class).single();
    }
    private Map<String, Long> groups(String table, String column, UUID id, String condition, List<String> keys) {
        var result = new LinkedHashMap<String, Long>(); keys.forEach(key -> result.put(key, 0L));
        jdbc.sql("select " + column + ",count(*) from dut_connect." + table + " where campaign_id=:id " + condition + " group by " + column)
            .param("id", id).query((rs, n) -> Map.entry(rs.getString(1), rs.getLong(2))).list().forEach(e -> result.put(e.getKey(), e.getValue()));
        return result;
    }
}
