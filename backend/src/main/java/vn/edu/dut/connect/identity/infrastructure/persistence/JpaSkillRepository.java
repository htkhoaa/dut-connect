package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import vn.edu.dut.connect.identity.domain.Skill;

interface JpaSkillRepository extends JpaRepository<Skill, UUID> {
    Page<Skill> findByActiveTrue(Pageable page);

    long countByIdInAndActiveTrue(Set<UUID> ids);

    @Query(value = "select s.* from dut_connect.skills s join dut_connect.student_skills us on s.id=us.skill_id where us.user_id=:userId order by s.name", nativeQuery = true)
    List<Skill> forUser(UUID userId);
}
