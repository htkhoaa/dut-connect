-- Keep the owner invariant independent of the configured database role/search_path.
CREATE OR REPLACE FUNCTION dut_connect.require_organization_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE organization_uuid uuid;
BEGIN
 IF TG_TABLE_NAME = 'organizations' THEN organization_uuid := NEW.id;
 ELSE organization_uuid := OLD.organization_id;
 END IF;
 IF EXISTS (SELECT 1 FROM dut_connect.organizations WHERE id=organization_uuid)
    AND NOT EXISTS (SELECT 1 FROM dut_connect.organization_members WHERE organization_id=organization_uuid AND member_role='OWNER') THEN
   RAISE EXCEPTION 'Organization requires an owner' USING ERRCODE='23514', CONSTRAINT='organization_requires_owner';
 END IF;
 RETURN NULL;
END $$;
