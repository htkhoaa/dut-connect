CREATE TABLE volunteer_registrations (
    id uuid PRIMARY KEY,
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    preferred_track varchar(20) NOT NULL CHECK (preferred_track IN ('TECHNICAL','LOGISTICS')),
    assigned_track varchar(20) CHECK (assigned_track IN ('TECHNICAL','LOGISTICS')),
    motivation varchar(1000) NOT NULL CHECK (length(trim(motivation)) > 0),
    availability varchar(1000),
    status varchar(20) NOT NULL CHECK (status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')),
    rejection_reason varchar(1000),
    reviewed_by_user_id uuid REFERENCES users(id),
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    version bigint NOT NULL,
    CONSTRAINT uk_volunteer_campaign_user UNIQUE (campaign_id,user_id),
    CHECK ((status='ACCEPTED') = (assigned_track IS NOT NULL)),
    CHECK ((status IN ('ACCEPTED','REJECTED')) = (reviewed_by_user_id IS NOT NULL)),
    CHECK ((reviewed_by_user_id IS NULL) = (reviewed_at IS NULL)),
    CHECK ((status='REJECTED') = (rejection_reason IS NOT NULL)),
    CHECK (rejection_reason IS NULL OR length(trim(rejection_reason)) > 0)
);
CREATE INDEX idx_volunteer_campaign_status ON volunteer_registrations(campaign_id,status);
CREATE INDEX idx_volunteer_user_created ON volunteer_registrations(user_id,created_at DESC,id);
