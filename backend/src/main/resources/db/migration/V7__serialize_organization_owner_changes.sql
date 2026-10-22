-- Serialize membership changes even when made outside the application services.
-- Writing the parent row also prevents write skew at REPEATABLE READ:
-- a concurrent transaction must retry rather than validate an old owner snapshot.
CREATE FUNCTION dut_connect.serialize_organization_membership_change()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE organization_uuid uuid;
BEGIN
 FOR organization_uuid IN
   SELECT DISTINCT candidate FROM unnest(
     CASE TG_OP
       WHEN 'INSERT' THEN ARRAY[NEW.organization_id]
       WHEN 'DELETE' THEN ARRAY[OLD.organization_id]
       ELSE ARRAY[OLD.organization_id, NEW.organization_id]
     END
   ) AS affected(candidate) ORDER BY candidate
 LOOP
   UPDATE dut_connect.organizations
      SET version = version
    WHERE id = organization_uuid;
 END LOOP;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;

CREATE TRIGGER serialize_organization_membership_change
BEFORE INSERT OR UPDATE OR DELETE ON dut_connect.organization_members
FOR EACH ROW EXECUTE FUNCTION dut_connect.serialize_organization_membership_change();
