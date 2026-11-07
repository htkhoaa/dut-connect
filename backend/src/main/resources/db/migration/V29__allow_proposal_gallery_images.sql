ALTER TABLE dut_connect.campaign_gallery
    ALTER COLUMN campaign_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES dut_connect.proposals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_campaign_gallery_proposal
    ON dut_connect.campaign_gallery(proposal_id, sort_order ASC, created_at DESC);
