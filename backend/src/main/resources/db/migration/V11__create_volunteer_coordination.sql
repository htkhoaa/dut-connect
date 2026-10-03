CREATE TABLE meetings (
 id uuid PRIMARY KEY, campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
 title varchar(200) NOT NULL CHECK(length(trim(title))>0), description text,
 meeting_type varchar(20) NOT NULL CHECK(meeting_type IN ('ONLINE','OFFLINE')),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 location varchar(300), meeting_url varchar(1000), created_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,version bigint NOT NULL,
 CHECK(meeting_type<>'ONLINE' OR length(trim(meeting_url))>0 AND meeting_url IS NOT NULL),
 CHECK(meeting_type<>'OFFLINE' OR length(trim(location))>0 AND location IS NOT NULL)
);
CREATE INDEX idx_meetings_campaign_start ON meetings(campaign_id,starts_at,id);
CREATE TABLE volunteer_tasks (
 id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
 title varchar(200) NOT NULL CHECK(length(trim(title))>0),description text NOT NULL CHECK(length(trim(description))>0),
 track varchar(20) NOT NULL CHECK(track IN ('TECHNICAL','LOGISTICS')),priority varchar(20) NOT NULL CHECK(priority IN ('LOW','MEDIUM','HIGH')),
 due_at timestamptz,status varchar(20) NOT NULL CHECK(status IN ('TODO','IN_PROGRESS','DONE','VERIFIED')),
 created_by_user_id uuid NOT NULL REFERENCES users(id),verified_by_user_id uuid REFERENCES users(id),verified_at timestamptz,
 created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,version bigint NOT NULL,
 CHECK((status='VERIFIED')=(verified_by_user_id IS NOT NULL)),CHECK((verified_at IS NULL)=(verified_by_user_id IS NULL))
);
CREATE INDEX idx_tasks_campaign_status ON volunteer_tasks(campaign_id,status,created_at DESC,id);
CREATE TABLE task_assignees(task_id uuid NOT NULL REFERENCES volunteer_tasks(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES users(id),assigned_at timestamptz NOT NULL,PRIMARY KEY(task_id,user_id));
CREATE INDEX idx_task_assignees_user ON task_assignees(user_id,task_id);
CREATE TABLE attendance_sessions(id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,title varchar(200) NOT NULL CHECK(length(trim(title))>0),starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),created_by_user_id uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,version bigint NOT NULL);
CREATE INDEX idx_attendance_campaign_start ON attendance_sessions(campaign_id,starts_at,id);
CREATE TABLE attendance_records(id uuid PRIMARY KEY,session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES users(id),status varchar(20) NOT NULL CHECK(status IN ('PRESENT','ABSENT')),recorded_by_user_id uuid NOT NULL REFERENCES users(id),recorded_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,CONSTRAINT uk_attendance_session_user UNIQUE(session_id,user_id));
CREATE TABLE volunteer_completions(id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES users(id),status varchar(20) NOT NULL CHECK(status IN ('PENDING','COMPLETED','VERIFIED')),verified_hours numeric(8,2) CHECK(verified_hours>=0),note varchar(1000),verified_by_user_id uuid REFERENCES users(id),verified_at timestamptz,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,version bigint NOT NULL,CONSTRAINT uk_completion_campaign_user UNIQUE(campaign_id,user_id),CHECK(status<>'VERIFIED' OR verified_hours IS NOT NULL),CHECK((status='VERIFIED')=(verified_by_user_id IS NOT NULL)),CHECK((verified_at IS NULL)=(verified_by_user_id IS NULL)));
CREATE INDEX idx_completion_campaign_status ON volunteer_completions(campaign_id,status);
CREATE INDEX idx_completion_user ON volunteer_completions(user_id,created_at DESC,id);
-- Accepted registrations are terminal. Lock their row so direct concurrent writes
-- cannot invalidate eligibility while these dependent records are inserted.
CREATE FUNCTION enforce_coordination_volunteer() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_campaign uuid;
BEGIN
 IF TG_TABLE_NAME='task_assignees' THEN SELECT campaign_id INTO target_campaign FROM dut_connect.volunteer_tasks WHERE id=NEW.task_id;
 ELSIF TG_TABLE_NAME='attendance_records' THEN SELECT campaign_id INTO target_campaign FROM dut_connect.attendance_sessions WHERE id=NEW.session_id;
 ELSE target_campaign:=NEW.campaign_id; END IF;
 PERFORM 1 FROM dut_connect.volunteer_registrations WHERE campaign_id=target_campaign AND user_id=NEW.user_id AND status='ACCEPTED' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer must be accepted for this campaign' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_task_accepted BEFORE INSERT OR UPDATE ON task_assignees FOR EACH ROW EXECUTE FUNCTION enforce_coordination_volunteer();
CREATE TRIGGER trg_attendance_accepted BEFORE INSERT OR UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION enforce_coordination_volunteer();
CREATE TRIGGER trg_completion_accepted BEFORE INSERT OR UPDATE ON volunteer_completions FOR EACH ROW EXECUTE FUNCTION enforce_coordination_volunteer();
