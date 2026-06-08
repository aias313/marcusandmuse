# Referral Deal Room

A multi-tenant SaaS where **two businesses manage a referral relationship as a
shared deal room**: either party refers prospects to the other, the receiving
party approves/rejects, and once a referral converts the system tracks revenue,
computes the referral fee, and produces shared statements both sides can see.

The defining design decision — **referral roles belong to the relationship's
terms, not to accounts** — is documented in **[SCHEMA.md](./SCHEMA.md)**. Read
that first.

> **Status: scaffold + schema checkpoint.** The project, full database schema,
> generated migration, optional RLS policies, and a demonstrative seed are in
> place. Features (submission/approval, fee calc, statements, contracts,
> payments) are **not built yet**, pending schema review.

## Stack

- **Next.js 15 (App Router) + TypeScript** — server actions for mutations
- **Drizzle ORM + PostgreSQL (Neon)** — type-safe schema & migrations
- **Clerk** — auth with organization (multi-tenant) support
- **Inngest** — background fee recalculation, statement generation, notifications
- **Tailwind** — UI
- **Resend** — transactional email

## Project layout

```
src/
  app/                 Next.js App Router (minimal shell for now)
    api/inngest/route.ts   Inngest serve endpoint
  db/
    schema.ts          ← canonical schema (THE design)
    relations.ts       Drizzle relational-query wiring
    index.ts           DB client (postgres.js)
    migrations/        generated SQL (0000_init.sql)
    policies.sql       optional RLS (defense-in-depth)
  inngest/             client + function stubs
  lib/
    fees.ts            pure fee/tail math (single source of truth)
    money.ts           cents + basis-point helpers
    tenant.ts          tenant-isolation guard
  middleware.ts        Clerk middleware
scripts/
  migrate.ts           apply migrations
  seed.ts              demo data (mutual deal, mixed-state referrals)
SCHEMA.md              design rationale & open questions
```

## Getting started

```bash
cp .env.example .env.local   # fill in Neon + Clerk (+ Inngest/Resend) values
npm install
npm run db:generate          # (already generated; re-run after schema edits)
npm run db:migrate           # apply to your Neon database
npm run db:seed              # load demo orgs/relationship/terms/referrals
npm run dev                  # http://localhost:3000
```

### What the seed demonstrates

- **Org A** (Northstar Agency) and **Org B** (Beacon Studios)
- **One deal room** with **two directions of terms**:
  - `A → B`: Northstar is paid, Beacon pays — **25% of net profit, 12-mo tail**
  - `B → A`: Beacon is paid, Northstar pays — **15% of net profit, 6-mo tail**
- Referrals in **submitted / accepted / rejected / converted** states
- For the converted referral: revenue entries with itemized deductions, fee
  calculations (computed by the same `computeFee` the Inngest job will use), an
  issued statement with line items, and a recorded payment
- Audit-log entries throughout

Roles flip purely based on which terms row applies — proving roles are a
property of the relationship, not the account.

## Notes on this sandbox

This was scaffolded in a self-contained subdirectory so it lifts cleanly into
its own repository. It has its own `package.json` and tooling and does not touch
the marketing site in the parent repo.

## Next steps (after schema sign-off)

1. **Capability 1** — deal room: invite/accept, submit referral, approve/reject,
   convert; email + in-app notifications. (+ Clerk→DB sync webhook.)
2. **Capability 2** — Inngest fee recompute + monthly statement generation.
3. **Capability 3** — contract generation from terms (Markdown/HTML → PDF).
4. **Capability 4** — payment tracking + audit-log surfacing in the UI.
