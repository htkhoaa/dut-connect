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
public class CompletionPersistence implements CompletionRepository {
    private final JdbcClient jdbc;
    private final JpaCompletionRepository completions;

    public CompletionPersistence(JdbcClient jdbc, JpaCompletionRepository completions) {
        this.jdbc = jdbc;
        this.completions = completions;
    }

    public List<VolunteerCompletion> completionBatch(Set<UUID> campaigns, Set<UUID> users) {
        if (campaigns.isEmpty() || users.isEmpty()) return List.of();
        var ids = jdbc.sql("select id from dut_connect.volunteer_completions where campaign_id in(:campaigns) and user_id in(:users)").param("campaigns", campaigns).param("users", users).query(UUID.class).list();
        return completions.findAllById(ids);
    }

    public Optional<VolunteerCompletion> completion(UUID c, UUID u) {
        var id = jdbc.sql("select id from dut_connect.volunteer_completions where campaign_id=:c and user_id=:u").param("c", c).param("u", u).query(UUID.class).optional();
        return id.flatMap(completions::findById);
    }

    public VolunteerCompletion saveCompletion(VolunteerCompletion v) {
        return completions.saveAndFlush(v);
    }

    public Map<UUID, VolunteerCompletion> completions(UUID c, Set<UUID> users) {
        if (users.isEmpty()) return Map.of();
        var ids = jdbc.sql("select id from dut_connect.volunteer_completions where campaign_id=:c and user_id in(:users)").param("c", c).param("users", users).query(UUID.class).list();
        return completions.findAllById(ids).stream().collect(java.util.stream.Collectors.toMap(VolunteerCompletion::userId, v -> v));
    }


}
