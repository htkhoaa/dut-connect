package vn.edu.dut.connect.volunteer.infrastructure.persistence;
import java.util.*;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.edu.dut.connect.volunteer.application.*;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
@Repository
public class VolunteerPersistence implements VolunteerRepository {
    private final JpaVolunteerRepository registrations;
    private final JdbcClient jdbc;
    public VolunteerPersistence(JpaVolunteerRepository registrations,JdbcClient jdbc){this.registrations=registrations;this.jdbc=jdbc;}
    public Optional<VolunteerRegistration> find(UUID id){return registrations.findById(id);}
    public Optional<UUID> campaignOf(UUID id){return jdbc.sql("select campaign_id from dut_connect_midterm.volunteer_registrations where id=:id").param("id",id).query(UUID.class).optional();}
    public Optional<VolunteerRegistration> lock(UUID id){return registrations.lockById(id);}
    public boolean exists(UUID campaign,UUID user){return registrations.existsByCampaignIdAndUserId(campaign,user);}
    public VolunteerRegistration save(VolunteerRegistration v){return registrations.saveAndFlush(v);}
    public Counts counts(UUID campaign) {
        return jdbc.sql("select count(*) as accepted,count(*) filter(where assigned_track='TECHNICAL') as technical,count(*) filter(where assigned_track='LOGISTICS') as logistics from dut_connect_midterm.volunteer_registrations where campaign_id=:id and status='ACCEPTED'")
            .param("id",campaign).query(Counts.class).single();
    }
    public PageResult<VolunteerRegistration> list(UUID campaign,UUID user,VolunteerQuery query) {
        String where=" from dut_connect_midterm.volunteer_registrations where 1=1";Map<String,Object> args=new HashMap<>();
        if(campaign!=null){where+=" and campaign_id=:campaign";args.put("campaign",campaign);}
        if(user!=null){where+=" and user_id=:user";args.put("user",user);}
        if(query.status()!=null){where+=" and status=:status";args.put("status",query.status().name());}
        if(query.track()!=null){where+=" and coalesce(assigned_track,preferred_track)=:track";args.put("track",query.track().name());}
        long total=jdbc.sql("select count(*)"+where).params(args).query(Long.class).single();
        var ids=jdbc.sql("select id"+where+" order by created_at desc,id limit :size offset :offset").params(args)
            .param("size",query.size()).param("offset",(long)query.page()*query.size()).query(UUID.class).list();
        var byId=registrations.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(VolunteerRegistration::id,v->v));
        int pages=(int)Math.min(Integer.MAX_VALUE,(total+query.size()-1)/query.size());
        return new PageResult<>(ids.stream().map(byId::get).toList(),query.page(),query.size(),total,pages,query.page()+1L<pages,query.page()>0);
    }
}
