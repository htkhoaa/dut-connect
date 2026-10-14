CREATE TABLE dut_connect.profile_avatars (
    user_id uuid PRIMARY KEY REFERENCES dut_connect.users(id) ON DELETE CASCADE,
    image_data bytea NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_avatar_size CHECK (octet_length(image_data) BETWEEN 1 AND 262144)
);
