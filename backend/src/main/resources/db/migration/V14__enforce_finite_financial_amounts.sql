-- PostgreSQL considers numeric NaN greater than finite numbers, so the existing
-- positivity checks alone cannot protect BigDecimal financial aggregates.
ALTER TABLE campaign_expenses ADD CONSTRAINT ck_expense_finite_amount CHECK (amount <> 'NaN'::numeric);
ALTER TABLE donations ADD CONSTRAINT ck_donation_finite_amount CHECK (amount <> 'NaN'::numeric);
ALTER TABLE payment_transactions ADD CONSTRAINT ck_payment_finite_amount CHECK (amount <> 'NaN'::numeric);
ALTER TABLE campaigns ADD CONSTRAINT ck_campaign_finite_funding CHECK (
    institutional_funding <> 'NaN'::numeric AND sponsor_funding <> 'NaN'::numeric
    AND fundraising_goal <> 'NaN'::numeric AND estimated_budget <> 'NaN'::numeric
);
ALTER TABLE proposals ADD CONSTRAINT ck_proposal_finite_funding CHECK (
    institutional_funding <> 'NaN'::numeric AND sponsor_funding <> 'NaN'::numeric
    AND fundraising_goal <> 'NaN'::numeric AND estimated_budget <> 'NaN'::numeric
);
ALTER TABLE campaign_expenses ADD CONSTRAINT ck_expense_rejection_reason_text CHECK (
    status <> 'REJECTED' OR rejection_reason ~ '[^[:space:]]'
);
