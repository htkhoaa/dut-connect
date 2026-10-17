package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.ProfileMatchingPort;

@Repository
public class ProfileMatchingRead implements ProfileMatchingPort {
    private final JdbcClient jdbc;
    public ProfileMatchingRead(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Map<UUID, Profile> profiles(Set<UUID> userIds) {
        if (userIds.isEmpty()) return Map.of();
        record Row(UUID userId, String experience, boolean active, long version, String email, String studentId, String fullName, String faculty) {}
        record SkillRow(UUID userId, String name) {}
        var rows = jdbc.sql("select p.user_id, p.experience, u.status='ACTIVE' as active, p.version, u.email, u.student_id, u.full_name, p.faculty from dut_connect_midterm.student_profiles p join dut_connect_midterm.users u on u.id=p.user_id where p.user_id in (:ids)")
                .param("ids", userIds).query(Row.class).list();
        var skillRows = jdbc.sql("select ss.user_id, s.name from dut_connect_midterm.student_skills ss join dut_connect_midterm.skills s on s.id=ss.skill_id where ss.user_id in (:ids) order by s.name,s.id")
                .param("ids", userIds).query(SkillRow.class).list();
        Map<UUID, List<String>> skills = new HashMap<>();
        for (var row : skillRows) skills.computeIfAbsent(row.userId(), ignored -> new ArrayList<>()).add(row.name());
        Map<UUID, Profile> result = new HashMap<>();
        for (var row : rows) result.put(row.userId(), new Profile(row.experience(), List.copyOf(skills.getOrDefault(row.userId(), List.of())), row.active(), row.version(), List.of(row.email(), row.studentId(), row.fullName(), row.faculty())));
        return Map.copyOf(result);
    }
}
