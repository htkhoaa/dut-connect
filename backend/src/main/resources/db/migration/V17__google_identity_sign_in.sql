CREATE TABLE google_identities (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subject varchar(255) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL
);

CREATE TABLE google_auth_challenges (
    id uuid PRIMARY KEY,
    nonce_hash char(64) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_google_challenges_expiry ON google_auth_challenges(expires_at);
