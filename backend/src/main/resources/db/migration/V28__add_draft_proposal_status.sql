ALTER TABLE dut_connect.proposals
    DROP CONSTRAINT IF EXISTS proposals_status_check;

ALTER TABLE dut_connect.proposals
    ADD CONSTRAINT proposals_status_check
    CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED','CANCELLED'));
