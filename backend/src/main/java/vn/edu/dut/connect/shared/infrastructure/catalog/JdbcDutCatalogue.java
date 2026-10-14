package vn.edu.dut.connect.shared.infrastructure.catalog;

import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.shared.application.DutCataloguePort;

@Repository
public class JdbcDutCatalogue implements DutCataloguePort {
    private final JdbcClient jdbc;
    public JdbcDutCatalogue(JdbcClient jdbc) { this.jdbc = jdbc; }
    public void lockImport() { jdbc.sql("SELECT pg_advisory_xact_lock(710202601)").query().singleRow(); }
    public Optional<UUID> administrator() {
        return jdbc.sql("SELECT id FROM dut_connect.users WHERE global_role='ADMIN' AND status='ACTIVE' ORDER BY created_at,id LIMIT 1").query(UUID.class).optional();
    }
    public Optional<UUID> imported(String key) {
        return jdbc.sql("SELECT coalesce(organization_id,campaign_id) FROM dut_connect.catalogue_seed_records WHERE seed_key=:key").param("key", key).query(UUID.class).optional();
    }
    public Optional<UUID> organizationNamed(String name) {
        return jdbc.sql("SELECT id FROM dut_connect.organizations WHERE lower(name)=lower(:name)").param("name", name).query(UUID.class).optional();
    }
    public UUID organizationType(String code) {
        return jdbc.sql("SELECT id FROM dut_connect.organization_types WHERE code=:code AND active").param("code", code).query(UUID.class).single();
    }
    public UUID category(String slug) {
        return jdbc.sql("SELECT id FROM dut_connect.campaign_categories WHERE slug=:slug AND active").param("slug", slug).query(UUID.class).single();
    }
    public void recordOrganization(String key, UUID id) {
        jdbc.sql("INSERT INTO dut_connect.catalogue_seed_records(seed_key,organization_id) VALUES(:key,:id)").param("key", key).param("id", id).update();
    }
    public void recordCampaign(String key, UUID id) {
        jdbc.sql("INSERT INTO dut_connect.catalogue_seed_records(seed_key,campaign_id) VALUES(:key,:id)").param("key", key).param("id", id).update();
    }
}
