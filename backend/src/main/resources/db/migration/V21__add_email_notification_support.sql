CREATE TABLE email_login_tokens (
    id uuid PRIMARY KEY,
    email varchar(255) NOT NULL,
    token_hash char(64) NOT NULL UNIQUE,
    full_name varchar(150),
    faculty varchar(150),
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_email_login_tokens_email ON email_login_tokens(email);
CREATE INDEX idx_email_login_tokens_expiry ON email_login_tokens(expires_at);
