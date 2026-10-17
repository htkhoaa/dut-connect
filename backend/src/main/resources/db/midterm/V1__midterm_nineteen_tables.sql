-- Midterm baseline, isolated from the archived full-version schema.

CREATE TABLE users (
 id uuid PRIMARY KEY, student_id varchar(32) NOT NULL UNIQUE, email varchar(255) NOT NULL UNIQUE,
 password_hash varchar(255) NOT NULL, full_name varchar(150) NOT NULL,
 global_role varchar(20) NOT NULL CHECK (global_role IN ('ADMIN','USER')),
 status varchar(20) NOT NULL CHECK (status IN ('ACTIVE','SUSPENDED')),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL
);
CREATE TABLE refresh_tokens (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash char(64) NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 revoked_at timestamptz, replaced_by_token_id uuid REFERENCES refresh_tokens(id),
 created_at timestamptz NOT NULL
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at);
CREATE TABLE student_profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 faculty varchar(150) NOT NULL, bio varchar(500),
 preferred_track varchar(20) CHECK (preferred_track IN ('TECHNICAL','LOGISTICS')),
 experience text, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL
);
CREATE TABLE skills (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL
);
CREATE TABLE student_skills (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 skill_id uuid NOT NULL REFERENCES skills(id),
 PRIMARY KEY (user_id,skill_id)
);
CREATE INDEX idx_student_skills_skill ON student_skills(skill_id);

INSERT INTO skills (id,name,active,created_at) VALUES
('00000000-0000-4000-8000-000000000001', 'Programming', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000002', 'Graphic Design', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000003', 'Photography', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000004', 'Video Editing', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000005', 'Communication', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000006', 'Tutoring', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000007', 'Data Entry', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000008', 'Electrical Support', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000009', 'Logistics', true, '2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000010', 'Event Operations', true, '2026-01-01T00:00:00Z');

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

INSERT INTO organization_types(id,code,name,active,created_at) VALUES
('00000000-0000-4000-8000-000000000101','UNIVERSITY_YOUTH_UNION','University Youth Union',true,'2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000102','FACULTY_YOUTH_UNION','Faculty Youth Union',true,'2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000103','STUDENT_ASSOCIATION','Student Association',true,'2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000104','CLUB','Club',true,'2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000105','STUDENT_TEAM','Student Team',true,'2026-01-01T00:00:00Z'),
('00000000-0000-4000-8000-000000000106','OTHER','Other',true,'2026-01-01T00:00:00Z');

-- Keep the owner invariant independent of the configured database role/search_path.
CREATE OR REPLACE FUNCTION dut_connect_midterm.require_organization_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE organization_uuid uuid;
BEGIN
 IF TG_TABLE_NAME = 'organizations' THEN organization_uuid := NEW.id;
 ELSE organization_uuid := OLD.organization_id;
 END IF;
 IF EXISTS (SELECT 1 FROM dut_connect_midterm.organizations WHERE id=organization_uuid)
    AND NOT EXISTS (SELECT 1 FROM dut_connect_midterm.organization_members WHERE organization_id=organization_uuid AND member_role='OWNER') THEN
   RAISE EXCEPTION 'Organization requires an owner' USING ERRCODE='23514', CONSTRAINT='organization_requires_owner';
 END IF;
 RETURN NULL;
END $$;

-- Serialize membership changes even when made outside the application services.
-- Writing the parent row also prevents write skew at REPEATABLE READ:
-- a concurrent transaction must retry rather than validate an old owner snapshot.
CREATE FUNCTION dut_connect_midterm.serialize_organization_membership_change()
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
   UPDATE dut_connect_midterm.organizations
      SET version = version
    WHERE id = organization_uuid;
 END LOOP;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;

CREATE TRIGGER serialize_organization_membership_change
BEFORE INSERT OR UPDATE OR DELETE ON dut_connect_midterm.organization_members
FOR EACH ROW EXECUTE FUNCTION dut_connect_midterm.serialize_organization_membership_change();

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
    CHECK (contribution_mode IN ('VOLUNTEER_ONLY')),
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
    CHECK (contribution_mode IN ('VOLUNTEER_ONLY')),
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
CREATE FUNCTION dut_connect_midterm.require_campaign_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE campaign_uuid uuid;
BEGIN
    IF TG_TABLE_NAME = 'campaigns' THEN campaign_uuid := NEW.id; ELSE campaign_uuid := OLD.campaign_id; END IF;
    IF EXISTS(SELECT 1 FROM dut_connect_midterm.campaigns WHERE id=campaign_uuid)
       AND NOT EXISTS(SELECT 1 FROM dut_connect_midterm.campaign_managers WHERE campaign_id=campaign_uuid AND manager_role='OWNER') THEN
        RAISE EXCEPTION 'Campaign requires an owner' USING ERRCODE='23514', CONSTRAINT='campaign_requires_owner';
    END IF;
    RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER campaign_owner_on_create AFTER INSERT ON campaigns
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION dut_connect_midterm.require_campaign_owner();
CREATE CONSTRAINT TRIGGER campaign_owner_on_membership AFTER UPDATE OR DELETE ON campaign_managers
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION dut_connect_midterm.require_campaign_owner();

INSERT INTO campaign_categories(id,name,slug,active,created_at,updated_at,version) VALUES
('00000000-0000-4000-8000-000000000201','Community Support','community-support',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0),
('00000000-0000-4000-8000-000000000202','Education','education',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0),
('00000000-0000-4000-8000-000000000203','Environment','environment',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0),
('00000000-0000-4000-8000-000000000204','Disaster Relief','disaster-relief',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0),
('00000000-0000-4000-8000-000000000205','Campus Support','campus-support',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0),
('00000000-0000-4000-8000-000000000206','Other','other',true,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z',0);

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

CREATE TABLE attendance_sessions(id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,title varchar(200) NOT NULL CHECK(length(trim(title))>0),starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),created_by_user_id uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,version bigint NOT NULL);
CREATE INDEX idx_attendance_campaign_start ON attendance_sessions(campaign_id,starts_at,id);
CREATE TABLE attendance_records(id uuid PRIMARY KEY,session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES users(id),status varchar(20) NOT NULL CHECK(status IN ('PRESENT','ABSENT')),recorded_by_user_id uuid NOT NULL REFERENCES users(id),recorded_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,CONSTRAINT uk_attendance_session_user UNIQUE(session_id,user_id));

CREATE FUNCTION enforce_attendance_volunteer() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_campaign uuid;
BEGIN
 SELECT campaign_id INTO target_campaign FROM dut_connect_midterm.attendance_sessions WHERE id=NEW.session_id;
 PERFORM 1 FROM dut_connect_midterm.volunteer_registrations WHERE campaign_id=target_campaign AND user_id=NEW.user_id AND status='ACCEPTED' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Volunteer must be accepted for this campaign' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_attendance_accepted BEFORE INSERT OR UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION enforce_attendance_volunteer();

CREATE TABLE dut_connect_midterm.profile_avatars (
    user_id uuid PRIMARY KEY REFERENCES dut_connect_midterm.users(id) ON DELETE CASCADE,
    image_data bytea NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_avatar_size CHECK (octet_length(image_data) BETWEEN 1 AND 262144)
);

-- Verified public DUT activity archive, separate from operational approvals/payments/hours.
CREATE TABLE dut_connect_midterm.published_activities (
 id uuid PRIMARY KEY, category varchar(100) NOT NULL, content jsonb NOT NULL,
 published_on date NOT NULL, image_url varchar(500) NOT NULL, source_url varchar(1000) NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ck_activity_languages CHECK(content ? 'vi' AND content ? 'en'),
 CONSTRAINT ck_activity_source CHECK(source_url LIKE 'https://dut.udn.vn/%'),
 CONSTRAINT ck_activity_image CHECK(image_url LIKE '/images/%')
);
CREATE INDEX idx_activities_publication ON dut_connect_midterm.published_activities(published_on DESC,id);
CREATE INDEX idx_activities_category ON dut_connect_midterm.published_activities(category);
INSERT INTO dut_connect_midterm.published_activities(id,category,content,published_on,image_url,source_url) VALUES
('d0712026-0000-4000-8000-000000000001','community-support','{"vi":{"title":"Mùa hè xanh 2025 – Sức trẻ Bách khoa tại xã Lìa","summary":"Hành trình 14 ngày tại vùng biên Quảng Trị, kết hợp công trình dân sinh và hỗ trợ kỹ năng số.","organizer":"Đoàn Thanh niên Trường Đại học Bách khoa","location":"Xã Lìa, tỉnh Quảng Trị","period":"14–27/07/2025","description":"Hơn 100 chiến sĩ tham gia gần 30 công trình và hoạt động. Chương trình xây nhà tình nghĩa, nhà vệ sinh, sửa lớp học, tặng tủ sách và tổ chức phiên chợ 0 đồng. Các lớp Bình dân học vụ số hướng dẫn người dân sử dụng VNeID và tiện ích số. Lễ tổng kết diễn ra ngày 26/7; bài công bố ghi toàn chiến dịch kéo dài đến 27/7."},"en":{"title":"Green Summer 2025 – DUT volunteers in Lia","summary":"A 14-day community programme combining public facilities and digital skills in Quang Tri.","organizer":"DUT Youth Union","location":"Lia commune, Quang Tri","period":"14–27 July 2025","description":"Over 100 volunteers delivered nearly 30 activities: housing and sanitation works, classroom repairs, bookshelves and zero-cost markets. Digital literacy sessions introduced VNeID and digital services. The closing ceremony took place on 26 July; the published programme ran through 27 July."}}','2025-07-29','/images/dut-volunteer-summer.jpg','https://dut.udn.vn/KhoaHoa/Tintuc/id/11414'),
('d0712026-0000-4000-8000-000000000002','community-support','{"vi":{"title":"Ra quân Xuân tình nguyện 2026 – Lan tỏa yêu thương","summary":"Lễ ra quân ngày 10/1 khởi động hành trình sẻ chia của 23 đơn vị trong trường.","organizer":"Đoàn Thanh niên – Hội Sinh viên DUT","location":"Trường Đại học Bách khoa, Đà Nẵng","period":"10/01/2026","description":"Đại diện các liên chi đoàn, câu lạc bộ, đội và nhóm nhận khăn rằn, mũ và vật phẩm trước khi lên đường. Kế hoạch giới thiệu tại buổi lễ bao phủ 12 xã thuộc Đà Nẵng, Huế và Quảng Trị, với năm hướng: an sinh, công trình thanh niên, môi trường, sức khỏe và kết nối cộng đồng. Hồ sơ này ghi nhận lễ ra quân; thông tin kế hoạch không được coi là kết quả đã nghiệm thu."},"en":{"title":"Spring Volunteering 2026 – Launching kindness","summary":"The 10 January launch brought together 23 DUT units for community service.","organizer":"DUT Youth Union and Student Association","location":"DUT campus, Da Nang","period":"10 January 2026","description":"Faculty unions, clubs and teams received volunteer equipment. The announced plan covered 12 communes in Da Nang, Hue and Quang Tri, focusing on welfare, youth projects, environment, health and community connection. This record documents the launch, not verified completion of the announced programme."}}','2026-01-10','/images/dut-volunteer-spring.jpg','https://dut.udn.vn/Fast/Tintuc/id/11702'),
('d0712026-0000-4000-8000-000000000003','environment','{"vi":{"title":"Chủ nhật xanh – Làm sạch biển Nguyễn Tất Thành","summary":"CLB Sức trẻ Khoa Nhiệt cùng sinh viên hành động vì hệ sinh thái biển.","organizer":"CLB Sức trẻ Khoa Công nghệ Nhiệt – Điện lạnh","location":"Bãi biển Nguyễn Tất Thành, Đà Nẵng","period":"29/03/2026","description":"Các thành viên thu gom rác dọc bãi biển, phân loại và xử lý theo quy định. Hoạt động gắn việc cải thiện cảnh quan với ý thức bảo vệ môi trường sống và trách nhiệm cộng đồng. Bài tổng kết của khoa nhấn mạnh tinh thần sống xanh và duy trì các chương trình thiết thực trong thời gian tới. Nguồn không công bố số người tham gia hoặc tổng khối lượng rác."},"en":{"title":"Green Sunday – Cleaning Nguyen Tat Thanh beach","summary":"The Thermal Engineering youth club took action for the coastal environment.","organizer":"Thermal and Refrigeration Engineering Youth Club","location":"Nguyen Tat Thanh beach, Da Nang","period":"29 March 2026","description":"Students collected, separated and disposed of beach litter. The activity promoted environmental responsibility and care for marine ecosystems. The faculty report highlights continued green activities. Participant numbers and waste quantities were not published."}}','2026-04-11','/images/dut-volunteer-beach.jpg','https://dut.udn.vn/KhoaNhietDL/Tintuc/id/11881'),
('d0712026-0000-4000-8000-000000000004','environment','{"vi":{"title":"Chủ nhật xanh – Sinh viên Môi trường chung tay","summary":"Dọn vệ sinh khuôn viên, phân loại rác và làm sạch không gian công cộng.","organizer":"Sinh viên Khoa Môi trường, DUT","location":"Khuôn viên và khu vực công cộng","period":"15/03/2026","description":"Sinh viên cùng thu gom rác, dọn khuôn viên và làm sạch các khu vực công cộng vào sáng Chủ nhật. Chương trình kết nối thực hành bảo vệ môi trường với tinh thần đoàn kết và trách nhiệm xã hội. Bài đăng ngày 17/3 ghi nhận hoạt động ngày 15/3, đồng thời khuyến khích duy trì những việc nhỏ vì môi trường bền vững. Nguồn không nêu số lượng tình nguyện viên."},"en":{"title":"Green Sunday – Environmental students in action","summary":"Campus cleaning, waste separation and care for shared spaces.","organizer":"DUT Environmental Engineering students","location":"Campus and public spaces","period":"15 March 2026","description":"Students collected litter, cleaned campus grounds and cared for shared public spaces. The programme connected practical environmental action with teamwork and social responsibility. Published on 17 March, the report describes the 15 March activity and encourages sustainable everyday habits. Volunteer numbers were not stated."}}','2026-03-17','/images/dut-campus-garden.jpeg','https://dut.udn.vn/KhoaCNTT/Tintuc/id/11824'),
('d0712026-0000-4000-8000-000000000005','community-support','{"vi":{"title":"Ngày hội hiến máu nhân đạo – Đợt 2 năm 2021","summary":"Tinh thần tương thân tương ái của sinh viên Bách khoa qua hoạt động hiến máu.","organizer":"Đoàn Thanh niên Trường Đại học Bách khoa","location":"Khu B, Trường Đại học Bách khoa","period":"Tháng 04/2021","description":"Ngày hội tại khu B ghi nhận hơn 400 đơn vị máu từ các tình nguyện viên theo thông tin Đoàn trường công bố ngày 20/4/2021. Hoạt động thể hiện sự sẻ chia với cộng đồng. Ngày cụ thể trong bài gốc bị ghi lỗi “180/4/2021”, nên hồ sơ chỉ thể hiện tháng. Số đơn vị máu là kết quả công bố, không phải số người tham gia hoặc giao dịch trong DUT Connect."},"en":{"title":"Humanitarian Blood Donation Day – Second round, 2021","summary":"DUT volunteers shared with the community through blood donation.","organizer":"DUT Youth Union","location":"DUT campus, Block B","period":"April 2021","description":"The Youth Union report published on 20 April records over 400 blood units collected at Block B. The source contains an invalid event date, so only the month is shown. Blood units are a published outcome, not a participant count or a DUT Connect transaction."}}','2021-04-20','/images/dut-volunteer-blood.jpg','https://dut.udn.vn/hoidongtruong/Tintuc/id/6213'),
('d0712026-0000-4000-8000-000000000006','education','{"vi":{"title":"Tư vấn hướng nghiệp – Đồng hành học sinh Nguyễn Huệ","summary":"Sinh viên Khoa Môi trường chia sẻ trải nghiệm học tập và lựa chọn ngành với học sinh Huế.","organizer":"Sinh viên Khoa Môi trường, DUT","location":"THPT Nguyễn Huệ, thành phố Huế","period":"07/03/2026","description":"Buổi tư vấn bắt đầu lúc 13h30, giới thiệu Kỹ thuật môi trường và Quản lý tài nguyên và môi trường. Sinh viên chia sẻ trải nghiệm thực hành, cơ hội nghề nghiệp và kinh nghiệm lựa chọn ngành; học sinh được trao đổi, đặt câu hỏi trực tiếp. Đây là hoạt động hỗ trợ giáo dục cộng đồng, không phải chiến dịch gây quỹ. Bài được công bố ngày 12/3/2026."},"en":{"title":"Career guidance – Supporting Nguyen Hue students","summary":"DUT environmental students shared study experiences and course choices with Hue pupils.","organizer":"DUT Environmental Engineering students","location":"Nguyen Hue High School, Hue","period":"7 March 2026","description":"Starting at 13:30, students introduced environmental engineering and resource management, practical learning, career prospects and course-selection advice. Pupils asked questions directly. This was community education support rather than fundraising. The report was published on 12 March 2026."}}','2026-03-12','/images/dut-campus-classrooms.jpg','https://dut.udn.vn/Tuyensinh2020/Tintuc/id/11809');

ALTER TABLE organizations ADD COLUMN seed_key varchar(100) UNIQUE;
ALTER TABLE campaigns ADD COLUMN seed_key varchar(100) UNIQUE;
