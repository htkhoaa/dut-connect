-- Flyway creates dut_connect before applying migrations and owns schema changes.
-- Domain tables arrive in their respective implementation phases.
COMMENT ON SCHEMA dut_connect IS 'DUT Connect application schema, managed exclusively by Flyway';
