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
public class TaskPersistence implements TaskRepository {
    private final JdbcClient jdbc;
    private final JpaTaskRepository tasks;

    public TaskPersistence(JdbcClient jdbc, JpaTaskRepository tasks) {
        this.jdbc = jdbc;
        this.tasks = tasks;
    }

    public Optional<VolunteerTask> task(UUID id) {
        return tasks.findById(id);
    }

    public Optional<UUID> taskCampaign(UUID id) {
        return jdbc.sql("select campaign_id from dut_connect.volunteer_tasks where id=:id").param("id", id).query(UUID.class).optional();
    }

    public VolunteerTask saveTask(VolunteerTask v) {
        return tasks.saveAndFlush(v);
    }

    public void deleteTask(UUID id) {
        tasks.deleteById(id);
        tasks.flush();
    }

    public PageResult<VolunteerTask> tasks(UUID c, UUID user, TaskStatus status, Pagination p) {
        String where = "1=1";
        var args = new HashMap<String, Object>();
        if (c != null) {
            where += " and campaign_id=:c";
            args.put("c", c);
        }
        if (user != null) {
            where += " and id in(select task_id from dut_connect.task_assignees where user_id=:u)";
            args.put("u", user);
        }
        if (status != null) {
            where += " and status=:s";
            args.put("s", status.name());
        }
        var page = pageIds(where, args, p);
        var map = tasks.findAllById(page.items()).stream().collect(java.util.stream.Collectors.toMap(VolunteerTask::id, v -> v));
        return page.map(map::get);
    }

    public Map<UUID, List<UUID>> assignees(Set<UUID> ids) {
        var out = new HashMap<UUID, List<UUID>>();
        if (ids.isEmpty()) return out;
        jdbc.sql("select task_id,user_id from dut_connect.task_assignees where task_id in(:ids) order by user_id").param("ids", ids).query((rs, n) -> {
            out.computeIfAbsent(rs.getObject(1, UUID.class), k -> new ArrayList<>()).add(rs.getObject(2, UUID.class));
            return 0;
        }).list();
        return out;
    }

    public void assign(UUID id, List<UUID> users) {
        jdbc.sql("delete from dut_connect.task_assignees where task_id=:id and user_id not in (:users)").param("id", id).param("users", users.isEmpty() ? List.of(new UUID(0, 0)) : users).update();
        for (var user : users)
            jdbc.sql("insert into dut_connect.task_assignees(task_id,user_id,assigned_at) values(:id,:u,:now) on conflict(task_id,user_id) do nothing").param("id", id).param("u", user).param("now", java.sql.Timestamp.from(Instant.now())).update();
    }

    private PageResult<UUID> pageIds(String where, Map<String, Object> args, Pagination p) {
        long total = jdbc.sql("select count(*) from dut_connect.volunteer_tasks where " + where).params(args).query(Long.class).single();
        var ids = jdbc.sql("select id from dut_connect.volunteer_tasks where " + where + " order by created_at desc,id limit :size offset :offset").params(args).param("size", p.size()).param("offset", (long) p.page() * p.size()).query(UUID.class).list();
        int pages = (int) Math.min(Integer.MAX_VALUE, (total + p.size() - 1) / p.size());
        return new PageResult<>(ids, p.page(), p.size(), total, pages, p.page() + 1L < pages, p.page() > 0);
    }
}
