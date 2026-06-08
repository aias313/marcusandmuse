# Schema design — Referral Deal Room

> **Review checkpoint.** This is the make-or-break decision the build prompt
> calls out: how referral roles are modeled. Please review this before we build
> features. Canonical source: [`src/db/schema.ts`](./src/db/schema.ts);
> generated DDL: [`src/db/migrations/0000_init.sql`](./src/db/migrations/0000_init.sql).

## The central decision: roles live on the *terms*, not on accounts

A referral relationship has two roles per direction:

- **referrer** — the party that *gets paid* a fee
- **payer** — the party that *pays* the fee

These roles are **not** columns on `organizations` or `users`, and **not** a
fixed property of a deal room. They are properties of a **direction of terms**:

```
relationships            (the deal room — links exactly two orgs, role-agnostic)
   └── relationship_terms (per DIRECTION: referring_org_id + paying_org_id + fee)
```

`relationships.org_a_id` / `org_b_id` are just **"initiator" / "invitee"** labels
for the room. They carry **no** role meaning. All role/fee meaning lives in
`relationship_terms`, where each row names a `referring_org_id` (gets paid) and a
`paying_org_id` (pays).

**Why this satisfies the constraint.** Org A can be the referrer in its room with
Org B *and* the payer in its room with Org C, because each is simply a different
`relationship_terms` row pointing at different orgs. Nothing about A's account
encodes a role.

### One-directional vs. mutual deals

- **One-directional:** the relationship has **one** active `relationship_terms`
  row (e.g. only A→B).
- **Mutual:** **two** active rows with the orgs swapped, each with its own terms.
  The seed sets up exactly this: `A→B = 25% net / 12mo` and `B→A = 15% net / 6mo`.

A partial unique index enforces **at most one active terms row per direction**:

```sql
CREATE UNIQUE INDEX relationship_terms_active_uq
  ON relationship_terms (relationship_id, referring_org_id, paying_org_id)
  WHERE effective_to IS NULL;
```

### How a referral's fee direction is derived

A `referrals` row stores only `submitted_by_org_id` (the prospective referrer).
The payer and the applicable fee are **derived**: find the active
`relationship_terms` for this relationship where `referring_org_id =
submitted_by_org_id`. That row's `paying_org_id` is who pays, and its
basis/percent/tail govern the fee. No role is hardcoded on the referral.

## Versioning & immutability (never overwrite financial history)

| Table | Strategy |
|---|---|
| `relationship_terms` | **Versioned** via `effective_from` / `effective_to` + `version`. Changing terms closes the old row and inserts a new one — history is preserved, and a fee can always be recomputed against the terms in force at the time. |
| `revenue_entries` | **Append-only.** Corrections insert a new row that `supersedes_id` the old one; `status` (`active`/`superseded`/`void`) marks the current figure. A partial unique index allows only one `active` row per `(referral, period)`. |
| `fee_calculations` | **Derived & recomputable.** 1:1 with the active revenue entry; the Inngest job replaces it from preserved sources. Snapshots the terms version (`applied_terms_id`) and tail window used. |
| `statements` | **Immutable once `issued`.** A wrong statement is set `void` and replaced (`superseded_by_statement_id`), never edited in place. Line items snapshot client name + amounts. |
| `audit_log` | **Append-only**, one row per state change, with `old_values`/`new_values`. |

## Money

- All amounts are **integer minor units (cents)** in `bigint` columns + a 3-letter
  ISO currency code. **No floats anywhere.** (`src/lib/money.ts`)
- Percentages are **integer basis points**: `2500 = 25.00%`.
- Currency defaults to `USD` but is per-relationship/per-terms configurable.

## The fee tail window

`relationship_terms.tail_months` defines how long fees accrue after a referral
**converts**. The window is **`[conversion_month, conversion_month + tail_months)`**
— the conversion month counts; the month exactly `tail_months` later does not.
A revenue entry outside the window yields a `fee_amount` of `0` with a recorded
`note`, rather than being dropped (auditable). Pure logic lives in
[`src/lib/fees.ts`](./src/lib/fees.ts) and is exercised by both the seed and
(soon) the Inngest recompute job — single source of truth for the math.

## Tenant isolation

Two layers:

1. **Query-layer scoping (primary).** [`src/lib/tenant.ts`](./src/lib/tenant.ts)
   resolves the caller's org memberships from Clerk and constrains every
   relationship-scoped query to rooms those orgs belong to.
2. **Row-Level Security (optional defense-in-depth).**
   [`src/db/policies.sql`](./src/db/policies.sql) — RLS policies keyed off a
   per-transaction `app.current_org_ids` GUC, so a query that *forgets* to scope
   still can't cross tenants. Opt-in; not in the migration journal.

## Table inventory (15)

`organizations`, `users`, `memberships` · `relationships`, `relationship_terms` ·
`referrals` · `deduction_categories`, `revenue_entries`,
`revenue_entry_deductions` · `fee_calculations` · `statements`,
`statement_line_items`, `payments` · `contracts` · `audit_log`.

> `contracts` (Capability 3) is included now so the contract↔terms link
> (`referenced_term_ids`, `is_out_of_date`) exists from the start and we avoid a
> later migration churn — but the generation feature itself is not built yet.

## Open questions for review

1. **Statement granularity.** Currently one statement per `(relationship,
   direction, period)` aggregating all referrals for that month. Alternative:
   per-referral statements. The rollup matches the prompt ("monthly rollup per
   relationship per direction") — confirm?
2. **Tail boundary convention.** I used `[start, start+tailMonths)` counting the
   conversion month. Some contracts start the clock at the *first revenue month*
   or the month *after* conversion. Which matches your agreement?
3. **Net profit definition.** `net_profit = gross_revenue − Σ itemized
   deductions`, with deduction categories configured by the **paying** org. Are
   deduction categories better scoped to the **relationship** (so both sides
   agree on them) than to the org?
4. **Multi-currency.** Terms carry their own currency; cross-currency between
   directions is allowed by the schema. Do you need FX handling, or will each
   relationship be single-currency in practice?
