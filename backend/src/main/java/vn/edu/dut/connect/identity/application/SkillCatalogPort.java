package vn.edu.dut.connect.identity.application;
import java.util.*;
public interface SkillCatalogPort {
    record SkillSnapshot(UUID id, String name, boolean active) {}
    Map<UUID, SkillSnapshot> findSkills(Set<UUID> ids);
}
