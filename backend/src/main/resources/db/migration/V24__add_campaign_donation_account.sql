ALTER TABLE proposals
    ADD COLUMN donation_bank_name varchar(120),
    ADD COLUMN donation_account_number varchar(64),
    ADD COLUMN donation_account_holder varchar(200);

ALTER TABLE campaigns
    ADD COLUMN donation_bank_name varchar(120),
    ADD COLUMN donation_account_number varchar(64),
    ADD COLUMN donation_account_holder varchar(200);
