package vn.edu.dut.connect.identity.application;

import java.util.*;
import vn.edu.dut.connect.identity.domain.Skill;
import vn.edu.dut.connect.shared.application.PageResult;

public interface SkillRepository {
    PageResult<Skill> activeSkills(Pagination page);

    List<Skill> userSkills(UUID userId);

    boolean allActive(Set<UUID> ids);

    void replaceSkills(UUID userId, Set<UUID> ids);
}
