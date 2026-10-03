CREATE TABLE organization_types (
 id uuid PRIMARY KEY, code varchar(50) NOT NULL UNIQUE, name varchar(120) NOT NULL,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL
);
CREATE TABLE organizations (
 id uuid PRIMARY KEY, name varchar(200) NOT NULL, slug varchar(220) NOT NULL UNIQUE,
 organization_type_id uuid NOT NULL REFERENCES organization_types(id), description text,
 status varchar(30) NOT NULL CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','SUSPENDED')),
 created_by_user_id uuid NOT NULL REFERENCES users(id), verified_by_user_id uuid REFERENCES users(id),
 verified_at timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL,
 CHECK ((verified_by_user_id IS NULL) = (verified_at IS NULL)),
 CHECK (status = 'PENDING_VERIFICATION' OR verified_at IS NOT NULL)
);
CREATE UNIQUE INDEX uk_organizations_name ON organizations(lower(name));
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE TABLE organization_members (
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 member_role varchar(20) NOT NULL CHECK (member_role IN ('OWNER','MANAGER','MEMBER')),
 joined_at timestamptz NOT NULL, PRIMARY KEY (organization_id,user_id)
);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);

-- Deferred until commit so creation and ownership transfer can update multiple rows atomically.
CREATE FUNCTION require_organization_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE organization_uuid uuid;
BEGIN
 IF TG_TABLE_NAME = 'organizations' THEN organization_uuid := NEW.id;
 ELSE organization_uuid := OLD.organization_id;
 END IF;
 IF EXISTS (SELECT 1 FROM organizations WHERE id=organization_uuid)
    AND NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id=organization_uuid AND member_role='OWNER') THEN
   RAISE EXCEPTION 'Organization requires an owner' USING ERRCODE='23514', CONSTRAINT='organization_requires_owner';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER organization_owner_on_create AFTER INSERT ON organizations
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION require_organization_owner();
CREATE CONSTRAINT TRIGGER organization_owner_on_membership AFTER UPDATE OR DELETE ON organization_members
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION require_organization_owner();
