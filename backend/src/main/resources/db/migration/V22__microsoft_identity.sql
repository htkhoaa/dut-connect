CREATE TABLE microsoft_identities (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subject varchar(255) NOT NULL UNIQUE,
    tenant_id varchar(64) NOT NULL,
    email varchar(255) NOT NULL,
    created_at timestamptz NOT NULL
);
