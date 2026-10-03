-- Keep dates representable in the ISO YYYY-MM-DD API and native date input.
-- This also excludes PostgreSQL's special infinite date values.
ALTER TABLE campaign_expenses ADD CONSTRAINT ck_expense_calendar_date CHECK (
    expense_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'
);
