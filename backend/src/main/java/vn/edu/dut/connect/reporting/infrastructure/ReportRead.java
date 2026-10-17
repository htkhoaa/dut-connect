package vn.edu.dut.connect.reporting.infrastructure;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.reporting.application.ReportQuery;
@Repository
public class ReportRead implements ReportQuery {
 private final JdbcClient jdbc;public ReportRead(JdbcClient jdbc){this.jdbc=jdbc;}
 public List<List<String>> volunteers(UUID id){return jdbc.sql("""
  with present_counts as (
   select r.user_id,count(*) as present from dut_connect_midterm.attendance_records r
   join dut_connect_midterm.attendance_sessions s on s.id=r.session_id
   where s.campaign_id=:id and r.status='PRESENT' group by r.user_id
  ),session_count as (select count(*) as total from dut_connect_midterm.attendance_sessions where campaign_id=:id)
  select u.full_name,u.student_id,p.faculty,c.title,v.assigned_track,v.status,coalesce(pc.present,0)::text,sc.total::text
  from dut_connect_midterm.volunteer_registrations v join dut_connect_midterm.users u on u.id=v.user_id
  left join dut_connect_midterm.student_profiles p on p.user_id=u.id join dut_connect_midterm.campaigns c on c.id=v.campaign_id
  cross join session_count sc left join present_counts pc on pc.user_id=v.user_id
  where v.campaign_id=:id order by v.created_at,v.id
  """).param("id",id).query((rs,n)->{var row=new ArrayList<String>();for(int i=1;i<=8;i++)row.add(Objects.toString(rs.getString(i),""));return (List<String>)row;}).list();}
}
