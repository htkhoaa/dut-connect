-- PostgreSQL numeric NaN passes a nonnegative check but is not a valid hour count.
ALTER TABLE volunteer_completions
    ADD CONSTRAINT ck_completion_finite_hours
    CHECK (verified_hours <> 'NaN'::numeric);
