CREATE TABLE campaign_expenses (
 id uuid PRIMARY KEY,
 campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
 title varchar(200) NOT NULL CHECK (length(trim(title))>0),
 category varchar(100) NOT NULL CHECK (length(trim(category))>0),
 amount numeric(19,0) NOT NULL CHECK (amount>0),
 expense_date date NOT NULL, description varchar(2000), proof_reference varchar(1000),
 status varchar(20) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
 submitted_by_user_id uuid NOT NULL REFERENCES users(id),
 reviewed_by_user_id uuid REFERENCES users(id), reviewed_at timestamptz,
 rejection_reason varchar(1000), created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 version bigint NOT NULL CHECK (version>=0),
 CHECK ((status='PENDING' AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL AND rejection_reason IS NULL)
     OR (status='APPROVED' AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL AND rejection_reason IS NULL)
     OR (status='REJECTED' AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL AND length(trim(rejection_reason))>0 AND rejection_reason IS NOT NULL))
);
CREATE INDEX idx_expenses_campaign_status ON campaign_expenses(campaign_id,status,created_at DESC,id);
CREATE INDEX idx_expenses_status_created ON campaign_expenses(status,created_at DESC,id);
