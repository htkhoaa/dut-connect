-- Copies retained data into a separate schema. Never updates/deletes the full schema.
DO $$
DECLARE name text; predicate text;
BEGIN
 IF to_regclass('dut_connect.users') IS NULL THEN RETURN; END IF;
 FOREACH name IN ARRAY ARRAY['users','skills','organization_types','campaign_categories','student_profiles','student_skills','profile_avatars','organizations','organization_members','proposals','campaigns','campaign_managers','campaign_skill_requirements','volunteer_registrations','meetings','attendance_sessions','attendance_records','published_activities'] LOOP
  IF to_regclass('dut_connect.'||name) IS NULL THEN CONTINUE; END IF;
  predicate := CASE
   WHEN name IN ('proposals','campaigns') THEN 'contribution_mode=''VOLUNTEER_ONLY'''
   WHEN name IN ('campaign_managers','campaign_skill_requirements','volunteer_registrations','meetings','attendance_sessions') THEN 'campaign_id IN (SELECT id FROM dut_connect_midterm.campaigns)'
   WHEN name='attendance_records' THEN 'session_id IN (SELECT id FROM dut_connect_midterm.attendance_sessions)'
   ELSE 'true' END;
  IF name IN ('organizations','campaigns') THEN
   EXECUTE format('INSERT INTO dut_connect_midterm.%I SELECT source.*,NULL::varchar(100) FROM dut_connect.%I source WHERE %s ON CONFLICT DO NOTHING',name,name,predicate);
  ELSE
   EXECUTE format('INSERT INTO dut_connect_midterm.%I SELECT * FROM dut_connect.%I WHERE %s ON CONFLICT DO NOTHING',name,name,predicate);
  END IF;
 END LOOP;
 IF to_regclass('dut_connect.catalogue_seed_records') IS NOT NULL THEN
  UPDATE dut_connect_midterm.organizations o SET seed_key=s.seed_key FROM dut_connect.catalogue_seed_records s WHERE s.organization_id=o.id;
  UPDATE dut_connect_midterm.campaigns c SET seed_key=s.seed_key FROM dut_connect.catalogue_seed_records s WHERE s.campaign_id=c.id;
 END IF;
END $$;
