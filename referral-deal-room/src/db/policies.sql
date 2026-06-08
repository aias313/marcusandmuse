-- ===========================================================================
-- Optional Row-Level Security (RLS) policies — DEFENSE IN DEPTH
-- ===========================================================================
-- Tenant isolation is enforced primarily at the query layer (src/lib/tenant.ts).
-- These policies are a second wall: even a query that *forgets* to scope by org
-- cannot read or write rows for a deal room the caller's orgs aren't a party to.
--
-- HOW IT WORKS
--   The app sets a per-transaction GUC with the caller's internal org ids:
--       SELECT set_config('app.current_org_ids', '<uuid>,<uuid>', true);
--   Policies compare row ownership against that list. Run all DB access through
--   a role that is subject to RLS (NOT the table owner / a BYPASSRLS role).
--
-- This file is intentionally NOT part of the drizzle migration journal so it
-- stays opt-in. Apply manually once the app role + GUC plumbing is in place:
--       psql "$DATABASE_URL_UNPOOLED" -f src/db/policies.sql
-- ===========================================================================

-- Parse the comma-separated GUC into a uuid[] (empty when unset).
CREATE OR REPLACE FUNCTION app_current_org_ids() RETURNS uuid[]
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    string_to_array(
      NULLIF(current_setting('app.current_org_ids', true), ''),
      ','
    )::uuid[],
    ARRAY[]::uuid[]
  );
$$;

-- True when a relationship is visible to the current org set (either side).
CREATE OR REPLACE FUNCTION app_can_access_relationship(rel uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM relationships r
    WHERE r.id = rel
      AND (
        r.org_a_id = ANY (app_current_org_ids())
        OR r.org_b_id = ANY (app_current_org_ids())
      )
  );
$$;

-- --- relationships ----------------------------------------------------------
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY relationships_party ON relationships
  USING (
    org_a_id = ANY (app_current_org_ids())
    OR org_b_id = ANY (app_current_org_ids())
  );

-- --- relationship-scoped child tables --------------------------------------
-- Each gates on the parent relationship being accessible.
ALTER TABLE relationship_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY relationship_terms_party ON relationship_terms
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_party ON referrals
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY statements_party ON statements
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_party ON payments
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contracts_party ON contracts
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE fee_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_calculations_party ON fee_calculations
  USING (app_can_access_relationship(relationship_id));

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_party ON audit_log
  USING (
    relationship_id IS NULL
    OR app_can_access_relationship(relationship_id)
  );

-- --- grandchild tables (gate via their parent referral/entry/statement) -----
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_entries_party ON revenue_entries
  USING (
    EXISTS (
      SELECT 1 FROM referrals r
      WHERE r.id = revenue_entries.referral_id
        AND app_can_access_relationship(r.relationship_id)
    )
  );

ALTER TABLE revenue_entry_deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_entry_deductions_party ON revenue_entry_deductions
  USING (
    EXISTS (
      SELECT 1 FROM revenue_entries e
      JOIN referrals r ON r.id = e.referral_id
      WHERE e.id = revenue_entry_deductions.revenue_entry_id
        AND app_can_access_relationship(r.relationship_id)
    )
  );

ALTER TABLE statement_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY statement_line_items_party ON statement_line_items
  USING (
    EXISTS (
      SELECT 1 FROM statements s
      WHERE s.id = statement_line_items.statement_id
        AND app_can_access_relationship(s.relationship_id)
    )
  );
