
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
