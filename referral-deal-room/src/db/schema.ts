/**
 * Referral Deal Room — database schema (Drizzle ORM / PostgreSQL)
 * ============================================================================
 *
 * THE CENTRAL DESIGN DECISION
 * ---------------------------
 * Referral roles ("referrer" = the party that gets paid; "payer" = the party
 * that pays) are NOT a property of an organization or a user. They are a
 * property of a *direction of terms* inside a *relationship*.
 *
 *   - `relationships` links exactly two orgs and is direction-agnostic. The
 *     `orgA`/`orgB` columns are just "initiator" and "invitee" labels for the
 *     deal room itself — they carry NO role meaning.
 *   - `relationship_terms` is where roles live. Each row names a
 *     `referringOrg` (gets paid) and a `payingOrg` (pays) plus the fee terms
 *     for that *one direction*. A mutual deal has two active terms rows with
 *     the orgs swapped. A one-directional deal has one.
 *
 * This is why Org A can be the referrer in its room with Org B while being the
 * payer in its room with Org C: each is just a different terms row. Nothing
 * about A's account encodes a role.
 *
 * MONEY
 * -----
 * All monetary amounts are integer minor units (cents) stored as bigint, plus
 * a 3-letter ISO currency code. Never floats. Percentages are integer basis
 * points (bps): 2500 = 25.00%.
 *
 * IMMUTABILITY / AUDITABILITY
 * ---------------------------
 * Financial history is never destructively overwritten:
 *   - `relationship_terms` are versioned (effective_from/effective_to).
 *   - `revenue_entries` are append-only and superseded, not edited.
 *   - `fee_calculations` are derived and recomputed from preserved sources.
 *   - `statements` become immutable once `issued`.
 *   - `audit_log` is append-only.
 *
 * NAMING: `drizzle.config.ts` sets `casing: "snake_case"`, so camelCase fields
 * here map to snake_case columns automatically.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Shared column helpers
// ---------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Money amount in integer minor units (cents). bigint keeps cents exact. */
const cents = (name?: string) =>
  name ? bigint(name, { mode: "number" }) : bigint({ mode: "number" });

/** 3-letter ISO 4217 currency code, e.g. "USD". */
const currencyCode = () => text().notNull().default("USD");

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const membershipRole = pgEnum("membership_role", ["owner", "member"]);

export const relationshipStatus = pgEnum("relationship_status", [
  "invited", // invite sent, invitee org has not accepted yet
  "active", // deal room open
  "paused", // temporarily suspended, no new accruals
  "terminated", // ended; history retained
]);

/** Basis the referral fee is computed against, for one direction of terms. */
export const feeBasis = pgEnum("fee_basis", [
  "net_profit", // gross revenue minus itemized deductions
  "gross_revenue", // top-line revenue
  "flat", // fixed amount per period, ignores revenue
]);

export const referralStatus = pgEnum("referral_status", [
  "submitted", // awaiting the paying party's decision
  "accepted", // confirmed in writing — gate before any fees can accrue
  "rejected", // declined, with reason
  "converted", // client signed/paying — starts the fee tail clock
  "closed", // relationship with this client wound down
]);

export const statementStatus = pgEnum("statement_status", [
  "draft", // being assembled / recomputable
  "issued", // immutable, both parties see identical numbers
  "void", // issued in error, superseded by a corrected statement
]);

export const paymentMethod = pgEnum("payment_method", [
  "bank_transfer",
  "card",
  "check",
  "cash",
  "other",
]);

export const revenueEntryStatus = pgEnum("revenue_entry_status", [
  "active", // the current figure for its (referral, period)
  "superseded", // replaced by a newer append-only correction
  "void", // retracted; excluded from calculations
]);

/** Entity types an audit_log row can describe. */
export const auditEntity = pgEnum("audit_entity", [
  "relationship",
  "relationship_terms",
  "referral",
  "revenue_entry",
  "fee_calculation",
  "statement",
  "payment",
  "membership",
  "contract",
]);

/** High-level action recorded in the audit_log. */
export const auditAction = pgEnum("audit_action", [
  "created",
  "updated",
  "status_changed",
  "invited",
  "accepted",
  "approved",
  "rejected",
  "converted",
  "closed",
  "terms_changed",
  "revenue_logged",
  "revenue_superseded",
  "recomputed",
  "statement_issued",
  "statement_voided",
  "payment_recorded",
  "contract_generated",
]);

// ---------------------------------------------------------------------------
// Tenancy: organizations, users, memberships
// ---------------------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid().primaryKey().defaultRandom(),
  /** Clerk Organization id (org_…). Source of truth for membership/auth. */
  clerkOrgId: text().unique(),
  legalName: text().notNull(),
  displayName: text().notNull(),
  /** Governing-law jurisdiction, e.g. "Delaware, USA". Used in contracts. */
  jurisdiction: text(),
  /** Postal/registered address; structured enough for contract headers. */
  address: jsonb().$type<{
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }>(),
  defaultCurrency: currencyCode(),
  ...timestamps,
});

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  /** Clerk User id (user_…). */
  clerkUserId: text().unique(),
  email: text().notNull(),
  name: text(),
  ...timestamps,
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRole().notNull().default("member"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_org_user_uq").on(t.orgId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Relationships (the deal room) + versioned, per-direction terms
// ---------------------------------------------------------------------------

export const relationships = pgTable(
  "relationships",
  {
    id: uuid().primaryKey().defaultRandom(),
    /**
     * The two parties. These are DIRECTION-AGNOSTIC "initiator/invitee"
     * labels for the room — they carry NO referrer/payer meaning. Roles live
     * in `relationship_terms`. `orgB` is nullable while status = 'invited'
     * (the invitee may not have an org in our system yet).
     */
    orgAId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    orgBId: uuid().references(() => organizations.id, { onDelete: "restrict" }),
    status: relationshipStatus().notNull().default("invited"),
    /**
     * The single currency for this entire deal room. One currency per
     * relationship (both directions of terms, all revenue, statements, and
     * payments use it) — set at creation, not per-direction.
     */
    currency: currencyCode(),
    /** Email the invite was sent to (resolves to orgB on acceptance). */
    invitedEmail: text(),
    createdByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    invitedAt: timestamp({ withTimezone: true }),
    acceptedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("relationships_org_a_idx").on(t.orgAId),
    index("relationships_org_b_idx").on(t.orgBId),
    // A room never links an org to itself.
    check("relationships_distinct_orgs", sql`${t.orgAId} <> ${t.orgBId}`),
  ],
);

export const relationshipTerms = pgTable(
  "relationship_terms",
  {
    id: uuid().primaryKey().defaultRandom(),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    /** WHO GETS PAID for this direction. */
    referringOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    /** WHO PAYS for this direction. */
    payingOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    feeBasis: feeBasis().notNull(),
    /** Basis points (2500 = 25.00%). Required unless feeBasis = 'flat'. */
    feePercentBps: integer(),
    /** Fixed amount per period in cents. Required when feeBasis = 'flat'. */
    flatAmount: cents(),
    /**
     * Length of the fee tail, in months, measured from the referral's
     * ACCEPTED date (acceptance starts the clock). Currency is inherited from
     * the parent relationship (one currency per deal).
     */
    tailMonths: integer().notNull(),
    /** Versioning window. effectiveTo = null means "currently active". */
    effectiveFrom: timestamp({ withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp({ withTimezone: true }),
    version: integer().notNull().default(1),
    note: text(),
    createdByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("relationship_terms_rel_idx").on(t.relationshipId),
    // At most ONE active terms row per (relationship, direction).
    uniqueIndex("relationship_terms_active_uq")
      .on(t.relationshipId, t.referringOrgId, t.payingOrgId)
      .where(sql`${t.effectiveTo} is null`),
    check(
      "relationship_terms_distinct_parties",
      sql`${t.referringOrgId} <> ${t.payingOrgId}`,
    ),
    // Percentage basis requires a percent; flat basis requires an amount.
    check(
      "relationship_terms_basis_fields",
      sql`(${t.feeBasis} = 'flat' and ${t.flatAmount} is not null)
          or (${t.feeBasis} in ('net_profit','gross_revenue') and ${t.feePercentBps} is not null)`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Referrals (the submission + approval flow)
// ---------------------------------------------------------------------------

export const referrals = pgTable(
  "referrals",
  {
    id: uuid().primaryKey().defaultRandom(),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    /**
     * The org that submitted this referral = the prospective REFERRER. The
     * payer is the other org in the relationship under the matching terms
     * direction. We resolve fee direction from this + relationship_terms.
     */
    submittedByOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    referredClientName: text().notNull(),
    contactName: text(),
    contactEmail: text(),
    contactPhone: text(),
    description: text(),
    status: referralStatus().notNull().default("submitted"),
    submittedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /** Accept/reject decision metadata (generic — covers both outcomes). */
    decidedAt: timestamp({ withTimezone: true }),
    decidedByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    rejectionReason: text(),
    /**
     * Acceptance timestamp — the fee tail window is anchored here
     * (accepted date + tailMonths). Set only when the referral is accepted.
     */
    acceptedAt: timestamp({ withTimezone: true }),
    /** When marked converted (client signed/paying); gates revenue logging. */
    convertedAt: timestamp({ withTimezone: true }),
    closedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("referrals_rel_idx").on(t.relationshipId),
    index("referrals_status_idx").on(t.status),
    index("referrals_submitter_idx").on(t.submittedByOrgId),
  ],
);

// ---------------------------------------------------------------------------
// Revenue + deductions (logged by the PAYING org against converted referrals)
// ---------------------------------------------------------------------------

/**
 * Configurable deduction categories (media / platform / transaction costs…).
 * Scoped to the paying org; null orgId rows are global defaults.
 */
export const deductionCategories = pgTable(
  "deduction_categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: uuid().references(() => organizations.id, { onDelete: "cascade" }),
    code: text().notNull(),
    label: text().notNull(),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("deduction_categories_org_code_uq").on(t.orgId, t.code)],
);

export const revenueEntries = pgTable(
  "revenue_entries",
  {
    id: uuid().primaryKey().defaultRandom(),
    referralId: uuid()
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    /** Accounting month this entry covers; stored as the 1st of the month. */
    period: date().notNull(),
    grossRevenue: cents().notNull(),
    /**
     * Persisted net profit = grossRevenue − sum(deductions). Stored (not just
     * derived) so historical figures are auditable even if categories change.
     */
    netProfit: cents().notNull(),
    currency: currencyCode(),
    /**
     * Append-only correction model: a new entry can supersede an older one for
     * the same (referral, period) rather than editing it. `status` marks which
     * figure is current. Fee calcs only read `active` rows.
     */
    status: revenueEntryStatus().notNull().default("active"),
    supersedesId: uuid().references((): any => revenueEntries.id, {
      onDelete: "set null",
    }),
    enteredByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    enteredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    note: text(),
    ...timestamps,
  },
  (t) => [
    index("revenue_entries_referral_idx").on(t.referralId),
    index("revenue_entries_period_idx").on(t.period),
    // Only one ACTIVE figure per referral per month.
    uniqueIndex("revenue_entries_active_uq")
      .on(t.referralId, t.period)
      .where(sql`${t.status} = 'active'`),
  ],
);

export const revenueEntryDeductions = pgTable(
  "revenue_entry_deductions",
  {
    id: uuid().primaryKey().defaultRandom(),
    revenueEntryId: uuid()
      .notNull()
      .references(() => revenueEntries.id, { onDelete: "cascade" }),
    categoryId: uuid().references(() => deductionCategories.id, {
      onDelete: "set null",
    }),
    /** Snapshot label so deleting a category doesn't rewrite history. */
    label: text().notNull(),
    amount: cents().notNull(),
    ...timestamps,
  },
  (t) => [index("revenue_entry_deductions_entry_idx").on(t.revenueEntryId)],
);

// ---------------------------------------------------------------------------
// Fee calculations (derived; recomputed by Inngest)
// ---------------------------------------------------------------------------

export const feeCalculations = pgTable(
  "fee_calculations",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** 1:1 with the active revenue entry it prices. */
    revenueEntryId: uuid()
      .notNull()
      .references(() => revenueEntries.id, { onDelete: "cascade" }),
    referralId: uuid()
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    // Snapshot of the resolved direction + terms used for this computation.
    referringOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    payingOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    appliedTermsId: uuid().references(() => relationshipTerms.id, {
      onDelete: "set null",
    }),
    basis: feeBasis().notNull(),
    /** Amount the percentage was applied to (net or gross), in cents. */
    basisAmount: cents().notNull(),
    appliedPercentBps: integer(),
    feeAmount: cents().notNull(),
    currency: currencyCode(),
    /** Whether the entry's period falls inside the tail window. */
    withinTail: boolean().notNull(),
    tailStart: date(),
    tailEnd: date(),
    note: text(),
    computedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("fee_calculations_entry_uq").on(t.revenueEntryId),
    index("fee_calculations_referral_idx").on(t.referralId),
    index("fee_calculations_rel_idx").on(t.relationshipId),
  ],
);

// ---------------------------------------------------------------------------
// Statements (PER-REFERRAL monthly, immutable once issued) + payments
// ---------------------------------------------------------------------------

export const statements = pgTable(
  "statements",
  {
    id: uuid().primaryKey().defaultRandom(),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    /** The specific referred client/relationship this statement bills. */
    referralId: uuid()
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    /** Snapshot client name at issue time for immutability. */
    referredClientName: text().notNull(),
    // The direction this statement bills (derived from the referral).
    referringOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    payingOrgId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    period: date().notNull(),
    currency: currencyCode(),
    status: statementStatus().notNull().default("draft"),
    grossRevenue: cents().notNull().default(0),
    totalDeductions: cents().notNull().default(0),
    netProfit: cents().notNull().default(0),
    feeAmount: cents().notNull().default(0),
    /** The fee calc this statement was issued from (audit linkage). */
    feeCalculationId: uuid().references(() => feeCalculations.id, {
      onDelete: "set null",
    }),
    issuedAt: timestamp({ withTimezone: true }),
    issuedByUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    /** Set when a void statement is replaced by a corrected one. */
    supersededByStatementId: uuid().references((): any => statements.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("statements_rel_idx").on(t.relationshipId),
    index("statements_referral_idx").on(t.referralId),
    // One statement per referral per period (drafts get reused/replaced).
    uniqueIndex("statements_referral_period_uq").on(t.referralId, t.period),
  ],
);

/**
 * Immutable snapshot of the itemized deduction breakdown for a statement, so a
 * statement's net-profit math is self-contained even if categories later change.
 */
export const statementDeductions = pgTable(
  "statement_deductions",
  {
    id: uuid().primaryKey().defaultRandom(),
    statementId: uuid()
      .notNull()
      .references(() => statements.id, { onDelete: "cascade" }),
    categoryId: uuid().references(() => deductionCategories.id, {
      onDelete: "set null",
    }),
    label: text().notNull(),
    amount: cents().notNull(),
    ...timestamps,
  },
  (t) => [index("statement_deductions_statement_idx").on(t.statementId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    statementId: uuid()
      .notNull()
      .references(() => statements.id, { onDelete: "restrict" }),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    amount: cents().notNull(),
    currency: currencyCode(),
    paidAt: date().notNull(),
    method: paymentMethod().notNull().default("bank_transfer"),
    reference: text(),
    note: text(),
    recordedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("payments_statement_idx").on(t.statementId),
    index("payments_rel_idx").on(t.relationshipId),
  ],
);

// ---------------------------------------------------------------------------
// Contracts (capability 3) — generated from terms, flagged when terms drift
// ---------------------------------------------------------------------------

export const contracts = pgTable(
  "contracts",
  {
    id: uuid().primaryKey().defaultRandom(),
    relationshipId: uuid()
      .notNull()
      .references(() => relationships.id, { onDelete: "cascade" }),
    title: text().notNull(),
    /** Frozen snapshot of the terms used to render this document. */
    termsSnapshot: jsonb().notNull(),
    /** The specific terms versions referenced, so we can detect drift. */
    referencedTermIds: jsonb().$type<string[]>().notNull().default([]),
    format: text().notNull().default("markdown"), // markdown | html | pdf
    content: text(),
    storageUrl: text(),
    /** True when underlying terms changed after generation. */
    isOutOfDate: boolean().notNull().default(false),
    generatedByUserId: uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index("contracts_rel_idx").on(t.relationshipId)],
);

// ---------------------------------------------------------------------------
// Audit log (append-only)
// ---------------------------------------------------------------------------

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Most events belong to a deal room; nullable for org/user-level events. */
    relationshipId: uuid().references(() => relationships.id, {
      onDelete: "cascade",
    }),
    /** The org on whose behalf the action was taken. */
    actorOrgId: uuid().references(() => organizations.id, {
      onDelete: "set null",
    }),
    actorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    entityType: auditEntity().notNull(),
    entityId: uuid().notNull(),
    action: auditAction().notNull(),
    oldValues: jsonb(),
    newValues: jsonb(),
    summary: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_rel_idx").on(t.relationshipId),
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_created_idx").on(t.createdAt),
  ],
);
