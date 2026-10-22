package vn.edu.dut.connect.identity.infrastructure.persistence;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.identity.application.SkillCatalogPort;
@Repository
public class SkillCatalog implements SkillCatalogPort {
    private final JdbcClient jdbc;
    public SkillCatalog(JdbcClient jdbc) { this.jdbc = jdbc; }
    public Map<UUID, SkillSnapshot> findSkills(Set<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return jdbc.sql("select id,name,active from dut_connect.skills where id in (:ids)").param("ids", ids)
                .query(SkillSnapshot.class).list().stream().collect(Collectors.toMap(SkillSnapshot::id, s -> s));
    }
}
