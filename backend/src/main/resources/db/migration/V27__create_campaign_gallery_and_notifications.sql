CREATE TABLE dut_connect.campaign_gallery (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES dut_connect.campaigns(id) ON DELETE CASCADE,
    image_data BYTEA NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    caption VARCHAR(300),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES dut_connect.users(id)
);

CREATE INDEX idx_campaign_gallery_campaign ON dut_connect.campaign_gallery(campaign_id, sort_order ASC, created_at DESC);

CREATE TABLE dut_connect.notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES dut_connect.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON dut_connect.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON dut_connect.notifications(user_id, created_at DESC);

-- Clean up any legacy source links and disclaimers in organization descriptions
UPDATE dut_connect.organizations
SET description = regexp_replace(description, E'\\n\\nNgu.*?$', '', 's')
WHERE description LIKE '%Nguồn hoạt động:%' OR description LIKE '%Hồ sơ phục vụ%';
