CREATE TABLE campaign_categories (
    id uuid PRIMARY KEY, name varchar(120) NOT NULL UNIQUE, slug varchar(140) NOT NULL UNIQUE,
    description varchar(300), active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL
);
CREATE UNIQUE INDEX uk_campaign_categories_name ON campaign_categories(lower(name));
CREATE TABLE proposals (
    id uuid PRIMARY KEY,
    proposer_user_id uuid NOT NULL REFERENCES users(id),
    organizer_type varchar(20) NOT NULL,
    organization_id uuid REFERENCES organizations(id),
    category_id uuid NOT NULL REFERENCES campaign_categories(id),
    title varchar(200) NOT NULL,
    summary varchar(500) NOT NULL,
    description text NOT NULL,
    expected_impact text,
    contribution_mode varchar(30) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    application_deadline timestamptz,
    fundraising_deadline timestamptz,
    target_volunteer_count integer,
    target_technical_count integer,
    target_logistics_count integer,
    volunteer_requirements text,
    fundraising_goal numeric(19,0),
    institutional_funding numeric(19,0) NOT NULL DEFAULT 0,
    sponsor_name varchar(200),
    sponsor_funding numeric(19,0) NOT NULL DEFAULT 0,
    estimated_budget numeric(19,0),
    status varchar(20) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    rejection_reason varchar(1000), reviewed_by_user_id uuid REFERENCES users(id), reviewed_at timestamptz,
    CHECK ((reviewed_by_user_id IS NULL) = (reviewed_at IS NULL)),
    CHECK (status = 'PENDING' OR reviewed_at IS NOT NULL),
    CHECK (status != 'REJECTED' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)),
    created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL,
CHECK ((organizer_type = 'ORGANIZATION') = (organization_id IS NOT NULL)),
    CHECK (organizer_type IN ('INDIVIDUAL','ORGANIZATION')),
    CHECK (contribution_mode IN ('VOLUNTEER_ONLY','DONATION_ONLY','HYBRID')),
    CHECK (end_date >= start_date),
    CHECK (fundraising_goal IS NULL OR fundraising_goal > 0),
    CHECK (institutional_funding >= 0 AND sponsor_funding >= 0),
    CHECK (estimated_budget IS NULL OR estimated_budget >= 0),
    CHECK (target_volunteer_count IS NULL OR target_volunteer_count >= 0),
    CHECK (target_technical_count IS NULL OR target_technical_count >= 0),
    CHECK (target_logistics_count IS NULL OR target_logistics_count >= 0),
    CHECK (contribution_mode = 'DONATION_ONLY' OR (target_volunteer_count IS NOT NULL AND target_volunteer_count >= 1)),
    CHECK (contribution_mode != 'DONATION_ONLY' OR (coalesce(target_volunteer_count,0)=0 AND coalesce(target_technical_count,0)=0 AND coalesce(target_logistics_count,0)=0)),
    CHECK (contribution_mode != 'VOLUNTEER_ONLY' OR (fundraising_goal IS NULL AND fundraising_deadline IS NULL)),
    CHECK (target_technical_count IS NULL OR target_logistics_count IS NULL OR (target_technical_count::bigint + target_logistics_count <= target_volunteer_count))
);
CREATE TABLE campaigns (
    id uuid PRIMARY KEY,
    proposal_id uuid NOT NULL UNIQUE REFERENCES proposals(id),
    slug varchar(240) NOT NULL UNIQUE, primary_contact_user_id uuid NOT NULL REFERENCES users(id),
    organizer_type varchar(20) NOT NULL,
    organization_id uuid REFERENCES organizations(id),
    category_id uuid NOT NULL REFERENCES campaign_categories(id),
    title varchar(200) NOT NULL,
    summary varchar(500) NOT NULL,
    description text NOT NULL,
    expected_impact text,
    contribution_mode varchar(30) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    application_deadline timestamptz,
    fundraising_deadline timestamptz,
    target_volunteer_count integer,
    target_technical_count integer,
    target_logistics_count integer,
    volunteer_requirements text,
    fundraising_goal numeric(19,0),
    institutional_funding numeric(19,0) NOT NULL DEFAULT 0,
    sponsor_name varchar(200),
    sponsor_funding numeric(19,0) NOT NULL DEFAULT 0,
    estimated_budget numeric(19,0),
    status varchar(20) NOT NULL CHECK (status IN ('DRAFT','OPEN','ACTIVE','COMPLETED','CANCELLED')),
    
    created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL,
CHECK ((organizer_type = 'ORGANIZATION') = (organization_id IS NOT NULL)),
    CHECK (organizer_type IN ('INDIVIDUAL','ORGANIZATION')),
    CHECK (contribution_mode IN ('VOLUNTEER_ONLY','DONATION_ONLY','HYBRID')),
    CHECK (end_date >= start_date),
    CHECK (fundraising_goal IS NULL OR fundraising_goal > 0),
    CHECK (institutional_funding >= 0 AND sponsor_funding >= 0),
    CHECK (estimated_budget IS NULL OR estimated_budget >= 0),
    CHECK (target_volunteer_count IS NULL OR target_volunteer_count >= 0),
    CHECK (target_technical_count IS NULL OR target_technical_count >= 0),
    CHECK (target_logistics_count IS NULL OR target_logistics_count >= 0),
    CHECK (contribution_mode = 'DONATION_ONLY' OR (target_volunteer_count IS NOT NULL AND target_volunteer_count >= 1)),
    CHECK (contribution_mode != 'DONATION_ONLY' OR (coalesce(target_volunteer_count,0)=0 AND coalesce(target_technical_count,0)=0 AND coalesce(target_logistics_count,0)=0)),
    CHECK (contribution_mode != 'VOLUNTEER_ONLY' OR (fundraising_goal IS NULL AND fundraising_deadline IS NULL)),
    CHECK (target_technical_count IS NULL OR target_logistics_count IS NULL OR (target_technical_count::bigint + target_logistics_count <= target_volunteer_count))
);
CREATE INDEX idx_proposals_status_created ON proposals(status,created_at);
CREATE INDEX idx_proposals_proposer ON proposals(proposer_user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_category ON campaigns(category_id);
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_mode ON campaigns(contribution_mode);
CREATE INDEX idx_campaigns_start ON campaigns(start_date);
CREATE TABLE campaign_managers (
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    manager_role varchar(20) NOT NULL CHECK (manager_role IN ('OWNER','MANAGER')),
    created_at timestamptz NOT NULL, PRIMARY KEY(campaign_id,user_id)
);
CREATE UNIQUE INDEX uk_campaign_owner ON campaign_managers(campaign_id) WHERE manager_role='OWNER';
CREATE INDEX idx_campaign_managers_user ON campaign_managers(user_id);
CREATE TABLE campaign_skill_requirements (
    campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES skills(id),
    track varchar(20) NOT NULL CHECK (track IN ('TECHNICAL','LOGISTICS')),
    importance integer NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    PRIMARY KEY(campaign_id,skill_id,track)
);
CREATE FUNCTION dut_connect.require_campaign_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE campaign_uuid uuid;
BEGIN
    IF TG_TABLE_NAME = 'campaigns' THEN campaign_uuid := NEW.id; ELSE campaign_uuid := OLD.campaign_id; END IF;
    IF EXISTS(SELECT 1 FROM dut_connect.campaigns WHERE id=campaign_uuid)
       AND NOT EXISTS(SELECT 1 FROM dut_connect.campaign_managers WHERE campaign_id=campaign_uuid AND manager_role='OWNER') THEN
        RAISE EXCEPTION 'Campaign requires an owner' USING ERRCODE='23514', CONSTRAINT='campaign_requires_owner';
    END IF;
    RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER campaign_owner_on_create AFTER INSERT ON campaigns
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION dut_connect.require_campaign_owner();
CREATE CONSTRAINT TRIGGER campaign_owner_on_membership AFTER UPDATE OR DELETE ON campaign_managers
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION dut_connect.require_campaign_owner();
