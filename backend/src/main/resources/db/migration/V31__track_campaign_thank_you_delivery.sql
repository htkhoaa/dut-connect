CREATE TABLE campaign_thank_you_deliveries (
    campaign_id uuid NOT NULL REFERENCES campaigns(id),
    user_id uuid NOT NULL REFERENCES users(id),
    contribution_type varchar(20) NOT NULL CHECK (contribution_type IN ('DONATION', 'VOLUNTEER')),
    status varchar(20) NOT NULL CHECK (status IN ('SENDING', 'SENT', 'FAILED')),
    error_code varchar(60),
    sent_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (campaign_id, user_id, contribution_type)
);
