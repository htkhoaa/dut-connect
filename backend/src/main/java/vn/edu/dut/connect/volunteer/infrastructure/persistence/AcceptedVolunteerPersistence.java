package vn.edu.dut.connect.volunteer.infrastructure.persistence;

import java.util.*;
import java.time.Instant;

import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.simple.JdbcClient;
import vn.edu.dut.connect.volunteer.application.*;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.identity.application.Pagination;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

@Repository
public class AcceptedVolunteerPersistence implements AcceptedVolunteerRepository {
    private final JdbcClient jdbc;
    private final JpaVolunteerRepository volunteers;

    public AcceptedVolunteerPersistence(JdbcClient jdbc, JpaVolunteerRepository volunteers) {
        this.jdbc = jdbc;
        this.volunteers = volunteers;
    }

    public List<Participation> participations(Set<UUID> campaigns, Set<UUID> users) {
        if (campaigns.isEmpty() || users.isEmpty()) return List.of();
        return jdbc.sql("select campaign_id,user_id,assigned_track from dut_connect.volunteer_registrations where campaign_id in(:campaigns) and user_id in(:users) and status='ACCEPTED'").param("campaigns", campaigns).param("users", users).query(Participation.class).list();
    }

    public Map<UUID, VolunteerTrack> accepted(UUID c, Set<UUID> users) {
        var out = new HashMap<UUID, VolunteerTrack>();
        if (users.isEmpty()) return out;
        jdbc.sql("select user_id,assigned_track from dut_connect.volunteer_registrations where campaign_id=:c and user_id in(:users) and status='ACCEPTED'").param("c", c).param("users", users).query((rs, n) -> {
            out.put(rs.getObject(1, UUID.class), VolunteerTrack.valueOf(rs.getString(2)));
            return 0;
        }).list();
        return out;
    }

    public PageResult<VolunteerRegistration> acceptedPage(UUID c, UUID u, Pagination p) {
        String where = "status='ACCEPTED'";
        var args = new HashMap<String, Object>();
        if (c != null) {
            where += " and campaign_id=:c";
            args.put("c", c);
        }
        if (u != null) {
            where += " and user_id=:u";
            args.put("u", u);
        }
        var page = pageIds(where, args, p);
        var map = volunteers.findAllById(page.items()).stream().collect(java.util.stream.Collectors.toMap(VolunteerRegistration::id, v -> v));
        return page.map(map::get);
    }

    private PageResult<UUID> pageIds(String where, Map<String, Object> args, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect.volunteer_registrations where " + where).params(args).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect.volunteer_registrations where " + where + " order by created_at desc,id limit :size offset :offset").params(args).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids, p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }
}
