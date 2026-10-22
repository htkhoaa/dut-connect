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
public class MeetingPersistence implements MeetingRepository {
    private final JdbcClient jdbc;
    private final JpaMeetingRepository meetings;

    public MeetingPersistence(JdbcClient jdbc, JpaMeetingRepository meetings) {
        this.jdbc = jdbc;
        this.meetings = meetings;
    }

    public Optional<Meeting> meeting(UUID id) {
        return meetings.findById(id);
    }

    public Optional<UUID> meetingCampaign(UUID id) {
        return jdbc.sql("select campaign_id from dut_connect.meetings where id=:id").param("id", id).query(UUID.class).optional();
    }

    public Meeting saveMeeting(Meeting v) {
        return meetings.saveAndFlush(v);
    }

    public void deleteMeeting(UUID id) {
        meetings.deleteById(id);
        meetings.flush();
    }

    public PageResult<Meeting> meetings(UUID c, Pagination p) {
        var page = pageIds("campaign_id=:c", Map.of("c", c), p);
        var map = meetings.findAllById(page.items()).stream().collect(java.util.stream.Collectors.toMap(Meeting::id, v -> v));
        return page.map(map::get);
    }

    private PageResult<UUID> pageIds(String where, Map<String, Object> args, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect.meetings where " + where).params(args).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect.meetings where " + where + " order by starts_at,id limit :size offset :offset").params(args).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids, p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }
}
