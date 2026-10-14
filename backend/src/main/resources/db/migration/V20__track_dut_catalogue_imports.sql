-- Only tracks imported aggregates; lifecycle creation runs through application use cases.
CREATE TABLE catalogue_seed_records (
    seed_key varchar(100) PRIMARY KEY,
    organization_id uuid REFERENCES organizations(id),
    campaign_id uuid REFERENCES campaigns(id),
    imported_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((organization_id IS NOT NULL) <> (campaign_id IS NOT NULL))
);
