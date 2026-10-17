package vn.edu.dut.connect.shared.infrastructure.catalog;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.edu.dut.connect.shared.application.EditionReadPort;

@Repository
public class JdbcEditionRead implements EditionReadPort {
    private final JdbcClient jdbc;
    public JdbcEditionRead(JdbcClient jdbc) { this.jdbc = jdbc; }
    public long businessTableCount() {
        return jdbc.sql("select count(*) from information_schema.tables where table_schema='dut_connect_midterm' and table_type='BASE TABLE' and table_name <> 'flyway_schema_history'")
                .query(Long.class).single();
    }
}
