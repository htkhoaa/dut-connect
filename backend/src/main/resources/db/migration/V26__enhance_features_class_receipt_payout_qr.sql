ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS class_name varchar(50);

ALTER TABLE campaign_expenses
    ADD COLUMN IF NOT EXISTS receipt_data bytea,
    ADD COLUMN IF NOT EXISTS receipt_content_type varchar(100);

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS payout_status varchar(30) DEFAULT 'PENDING_FUNDS',
    ADD COLUMN IF NOT EXISTS payout_receipt_data bytea,
    ADD COLUMN IF NOT EXISTS payout_receipt_content_type varchar(100),
    ADD COLUMN IF NOT EXISTS payout_amount numeric(19,0),
    ADD COLUMN IF NOT EXISTS payout_transferred_at timestamptz,
    ADD COLUMN IF NOT EXISTS payout_note text;

ALTER TABLE attendance_sessions
    ADD COLUMN IF NOT EXISTS qr_token varchar(64),
    ADD COLUMN IF NOT EXISTS qr_expires_at timestamptz;

ALTER TABLE payment_transactions
    DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;

ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_provider_check CHECK(provider IN ('mock','zalopay','payos'));

ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS payos_order_code bigint,
    ADD COLUMN IF NOT EXISTS payos_payment_link_id varchar(100),
    ADD COLUMN IF NOT EXISTS qr_code_url text;
