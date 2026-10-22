package vn.edu.dut.connect.reporting.infrastructure;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.reporting.application.ReportQuery;

@Repository
public class ReportRead implements ReportQuery {
    private final JdbcClient jdbc;
    public ReportRead(JdbcClient jdbc) { this.jdbc = jdbc; }
    public List<List<String>> volunteers(UUID id) {
        return rows("""
            with present_counts as (
              select r.user_id,count(*) as present from dut_connect.attendance_records r
              join dut_connect.attendance_sessions s on s.id=r.session_id
              where s.campaign_id=:id and r.status='PRESENT' group by r.user_id
            ), session_count as (
              select count(*) as total from dut_connect.attendance_sessions where campaign_id=:id
            )
            select u.full_name,u.student_id,p.faculty,c.title,v.assigned_track,v.status,
              coalesce(pc.present,0),sc.total,
              coalesce(com.status,'PENDING'),case when com.status='VERIFIED' then com.verified_hours::text end,
              case when com.status='VERIFIED' then to_char(com.verified_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end
            from dut_connect.volunteer_registrations v join dut_connect.users u on u.id=v.user_id
            left join dut_connect.student_profiles p on p.user_id=u.id join dut_connect.campaigns c on c.id=v.campaign_id
            cross join session_count sc left join present_counts pc on pc.user_id=v.user_id
            left join dut_connect.volunteer_completions com on com.campaign_id=v.campaign_id and com.user_id=v.user_id
            where v.campaign_id=:id order by v.created_at,v.id
            """, id);
    }
    public List<List<String>> donations(UUID id) {
        return rows("""
            select d.id::text,u.student_id,u.full_name,d.amount::text,d.status,
              to_char(p.paid_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),p.provider,p.provider_transaction_id
            from dut_connect.donations d join dut_connect.users u on u.id=d.donor_user_id
            left join lateral (select * from dut_connect.payment_transactions t where t.donation_id=d.id
              order by case when t.status in ('PAID','REFUNDED') then 0 else 1 end,t.created_at desc,t.id limit 1) p on true
            where d.campaign_id=:id order by d.created_at,d.id
            """, id);
    }
    public List<List<String>> expenses(UUID id) {
        return rows("""
            select e.title,e.category,e.amount::text,e.expense_date::text,e.status,u.full_name,r.full_name,
              to_char(e.reviewed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            from dut_connect.campaign_expenses e join dut_connect.users u on u.id=e.submitted_by_user_id
            left join dut_connect.users r on r.id=e.reviewed_by_user_id
            where e.campaign_id=:id order by e.created_at,e.id
            """, id);
    }
    public String sponsor(UUID id) { return jdbc.sql("select coalesce(sponsor_name,'') from dut_connect.campaigns where id=:id").param("id",id).query(String.class).single(); }
    private List<List<String>> rows(String sql, UUID id) {
        return jdbc.sql(sql).param("id", id).query((rs, n) -> {
            var row = new ArrayList<String>();
            for (int i=1; i<=rs.getMetaData().getColumnCount(); i++) row.add(Objects.requireNonNullElse(rs.getString(i), ""));
            return List.copyOf(row);
        }).list();
    }
}
