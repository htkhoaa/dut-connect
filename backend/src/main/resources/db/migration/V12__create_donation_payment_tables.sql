CREATE TABLE donations (
 id uuid PRIMARY KEY, campaign_id uuid NOT NULL REFERENCES campaigns(id), donor_user_id uuid NOT NULL REFERENCES users(id),
 amount numeric(19,0) NOT NULL CHECK(amount>0), status varchar(30) NOT NULL CHECK(status IN ('CREATED','PENDING_PAYMENT','PAID','FAILED','CANCELLED','REFUNDED')),
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL
);
CREATE INDEX idx_donations_campaign_status ON donations(campaign_id,status);
CREATE INDEX idx_donations_donor_created ON donations(donor_user_id,created_at DESC,id);
CREATE INDEX idx_donations_created ON donations(created_at);
CREATE TABLE payment_transactions (
 id uuid PRIMARY KEY, donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
 provider varchar(30) NOT NULL CHECK(provider IN ('mock','zalopay')),
 status varchar(30) NOT NULL CHECK(status IN ('CREATED','PROVIDER_PENDING','PAID','FAILED','CANCELLED','REFUNDED')),
 provider_order_id varchar(100) NOT NULL UNIQUE, provider_transaction_id varchar(100) UNIQUE,
 amount numeric(19,0) NOT NULL CHECK(amount>0), checkout_url varchar(2000), provider_response_code varchar(100), failure_reason varchar(1000),
 expires_at timestamptz, paid_at timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, version bigint NOT NULL,
 CHECK((status IN ('PAID','REFUNDED'))=(paid_at IS NOT NULL)),
 CHECK((status IN ('PAID','REFUNDED'))=(provider_transaction_id IS NOT NULL))
);
CREATE INDEX idx_payments_donation ON payment_transactions(donation_id,created_at DESC,id);
CREATE INDEX idx_payments_pending ON payment_transactions(status,expires_at);
