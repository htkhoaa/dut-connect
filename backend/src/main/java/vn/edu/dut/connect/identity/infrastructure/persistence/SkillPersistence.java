package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.*;
import vn.edu.dut.connect.identity.domain.Skill;
import vn.edu.dut.connect.identity.application.SkillRepository;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

@Repository
public class SkillPersistence implements SkillRepository {
    private final JpaSkillRepository skills;
    private final JdbcClient jdbc;

    public SkillPersistence(JpaSkillRepository skills, JdbcClient jdbc) {
        this.skills = skills;
        this.jdbc = jdbc;
    }

    public PageResult<Skill> activeSkills(Pagination query) {
        Page<Skill> page = skills.findByActiveTrue(PageRequest.of(query.page(), query.size(),
                Sort.by("name").ascending().and(Sort.by("id"))));
        return new PageResult<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.hasNext(), page.hasPrevious());
    }

    public List<Skill> userSkills(UUID id) {
        return skills.forUser(id);
    }

    public boolean allActive(Set<UUID> ids) {
        return skills.countByIdInAndActiveTrue(ids) == ids.size();
    }

    public void replaceSkills(UUID id, Set<UUID> ids) {
        jdbc.sql("delete from dut_connect_midterm.student_skills where user_id=:id").param("id", id).update();
        for (UUID skill : ids)
            jdbc.sql("insert into dut_connect_midterm.student_skills(user_id,skill_id) values (:user,:skill)")
                    .param("user", id).param("skill", skill).update();
    }
}
