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
public class AttendancePersistence implements AttendanceRepository {
    private final JdbcClient jdbc;
    private final JpaSessionRepository sessions;

    public AttendancePersistence(JdbcClient jdbc, JpaSessionRepository sessions) {
        this.jdbc = jdbc;
        this.sessions = sessions;
    }

    public List<AttendanceCounts> attendanceCounts(Set<UUID> campaigns, Set<UUID> users) {
        if (campaigns.isEmpty() || users.isEmpty()) return List.of();
        return jdbc.sql("select v.campaign_id,v.user_id,count(r.id) filter(where r.status='PRESENT') as present_sessions,count(s.id) as total_sessions from dut_connect_midterm.volunteer_registrations v left join dut_connect_midterm.attendance_sessions s on s.campaign_id=v.campaign_id left join dut_connect_midterm.attendance_records r on r.session_id=s.id and r.user_id=v.user_id where v.campaign_id in(:campaigns) and v.user_id in(:users) and v.status='ACCEPTED' group by v.campaign_id,v.user_id").param("campaigns", campaigns).param("users", users).query(AttendanceCounts.class).list();
    }

    public Optional<AttendanceSession> session(UUID id) {
        return sessions.findById(id);
    }

    public Optional<UUID> sessionCampaign(UUID id) {
        return jdbc.sql("select campaign_id from dut_connect_midterm.attendance_sessions where id=:id").param("id", id).query(UUID.class).optional();
    }

    public AttendanceSession saveSession(AttendanceSession v) {
        return sessions.saveAndFlush(v);
    }

    public void deleteSession(UUID id) {
        sessions.deleteById(id);
        sessions.flush();
    }

    public PageResult<AttendanceSession> sessions(UUID c, Pagination p) {
        var page = pageIds("campaign_id=:c", Map.of("c", c), p);
        var map = sessions.findAllById(page.items()).stream().collect(java.util.stream.Collectors.toMap(AttendanceSession::id, v -> v));
        return page.map(map::get);
    }

    public PageResult<AttendanceRow> records(UUID id, Pagination p) {
        var page = recordIds("session_id=:id", Map.of("id", id), p);
        if (page.items().isEmpty()) return page.map(k -> null);
        var rows = jdbc.sql("select id,session_id,user_id,status,recorded_by_user_id,recorded_at,updated_at from dut_connect_midterm.attendance_records where id in(:ids)").param("ids", page.items()).query(AttendanceRow.class).list();
        var map = rows.stream().collect(java.util.stream.Collectors.toMap(AttendanceRow::id, v -> v));
        return page.map(map::get);
    }

    public List<AttendanceRow> upsert(UUID session, UUID actor, List<AttendanceInput> records) {
        for (var r : records)
            jdbc.sql("insert into dut_connect_midterm.attendance_records(id,session_id,user_id,status,recorded_by_user_id,recorded_at,updated_at) values(:id,:s,:u,:status,:actor,:now,:now) on conflict(session_id,user_id) do update set status=excluded.status,recorded_by_user_id=excluded.recorded_by_user_id,recorded_at=excluded.recorded_at,updated_at=excluded.updated_at").param("id", UUID.randomUUID()).param("s", session).param("u", r.userId()).param("status", r.status().name()).param("actor", actor).param("now", java.sql.Timestamp.from(Instant.now())).update();
        return jdbc.sql("select id,session_id,user_id,status,recorded_by_user_id,recorded_at,updated_at from dut_connect_midterm.attendance_records where session_id=:s and user_id in(:users) order by user_id").param("s", session).param("users", records.stream().map(AttendanceInput::userId).toList()).query(AttendanceRow.class).list();
    }

    public Map<UUID, Long> presentCounts(UUID c, Set<UUID> users) {
        var out = new HashMap<UUID, Long>();
        if (users.isEmpty()) return out;
        jdbc.sql("select r.user_id,count(*) from dut_connect_midterm.attendance_records r join dut_connect_midterm.attendance_sessions s on s.id=r.session_id where s.campaign_id=:c and r.status='PRESENT' and r.user_id in(:users) group by r.user_id").param("c", c).param("users", users).query((rs, n) -> {
            out.put(rs.getObject(1, UUID.class), rs.getLong(2));
            return 0;
        }).list();
        return out;
    }

    public long sessionCount(UUID c) {
        return jdbc.sql("select count(*) from dut_connect_midterm.attendance_sessions where campaign_id=:c").param("c", c).query(Long.class).single();
    }

    private PageResult<UUID> pageIds(String where, Map<String, Object> args, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect_midterm.attendance_sessions where " + where).params(args).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect_midterm.attendance_sessions where " + where + " order by starts_at,id limit :size offset :offset").params(args).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids, p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }

    private PageResult<UUID> recordIds(String where, Map<String, Object> args, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect_midterm.attendance_records where " + where).params(args).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect_midterm.attendance_records where " + where + " order by user_id,id limit :size offset :offset").params(args).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids, p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }
}
