package vn.edu.dut.connect.dashboard.infrastructure;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.dashboard.application.DashboardQuery;
@Repository
public class DashboardRead implements DashboardQuery {
 private final JdbcClient jdbc;
 public DashboardRead(JdbcClient jdbc){this.jdbc=jdbc;}
 public Admin admin(){return new Admin(count("campaigns","status='ACTIVE'"),count("campaigns","status='COMPLETED'"),count("proposals","status='PENDING'"),count("organizations","status='PENDING_VERIFICATION'"),count("organizations","status='VERIFIED'"),jdbc.sql("select count(distinct user_id) from dut_connect_midterm.volunteer_registrations where status='ACCEPTED'").query(Long.class).single());}
 public Campaign campaign(UUID id){
  var applications=groups("status",id,"",List.of("PENDING","ACCEPTED","REJECTED","CANCELLED"));
  applications.put("TOTAL",applications.values().stream().mapToLong(Long::longValue).sum());
  long present=jdbc.sql("select count(*) from dut_connect_midterm.attendance_records r join dut_connect_midterm.attendance_sessions s on s.id=r.session_id where s.campaign_id=:id and r.status='PRESENT'").param("id",id).query(Long.class).single();
  return new Campaign(Map.copyOf(applications),Map.copyOf(groups("assigned_track",id,"and status='ACCEPTED'",List.of("TECHNICAL","LOGISTICS"))),campaignCount("attendance_sessions",id),present,campaignCount("meetings",id));
 }
 private long count(String table,String condition){return jdbc.sql("select count(*) from dut_connect_midterm."+table+" where "+condition).query(Long.class).single();}
 private long campaignCount(String table,UUID id){return jdbc.sql("select count(*) from dut_connect_midterm."+table+" where campaign_id=:id").param("id",id).query(Long.class).single();}
 private Map<String,Long> groups(String column,UUID id,String condition,List<String> keys){
  var result=new LinkedHashMap<String,Long>();keys.forEach(k->result.put(k,0L));
  jdbc.sql("select "+column+",count(*) from dut_connect_midterm.volunteer_registrations where campaign_id=:id "+condition+" group by "+column).param("id",id).query((rs,n)->Map.entry(rs.getString(1),rs.getLong(2))).list().forEach(e->result.put(e.getKey(),e.getValue()));return result;
 }
}
