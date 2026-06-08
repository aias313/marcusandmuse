/**
 * Seed script — demonstrates the make-or-break design: roles live on the
 * relationship's terms, not on accounts.
 *
 * Sets up:
 *   - Org A (Northstar Agency) and Org B (Beacon Studios)
 *   - ONE deal room (relationship) between them
 *   - TWO terms rows, one per direction, with DIFFERENT terms:
 *        A → B : 25% of net profit, 12-month tail   (A is paid, B pays)
 *        B → A : 15% of net profit, 6-month  tail   (B is paid, A pays)
 *   - Referrals in several states (submitted, accepted, rejected, converted)
 *   - For the converted referral: revenue entries + itemized deductions, fee
 *     calculations (via the same pure `computeFee` the Inngest job will use),
 *     an issued statement with line items, and a recorded payment
 *   - Audit-log entries throughout
 *
 * Run with: `npm run db:seed`. Dev-only; refuses to run with NODE_ENV=production.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { computeFee } from "../src/lib/fees";
import { formatMoney } from "../src/lib/money";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed in production");
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set");

const sql = postgres(url, { max: 1 });
const db = drizzle(sql, { schema, casing: "snake_case" });

const {
  organizations,
  users,
  memberships,
  relationships,
  relationshipTerms,
  referrals,
  deductionCategories,
  revenueEntries,
  revenueEntryDeductions,
  feeCalculations,
  statements,
  statementLineItems,
  payments,
  auditLog,
} = schema;

/** First-of-month UTC date helper for `date` columns (yyyy-mm-dd strings). */
function ym(year: number, month1to12: number): string {
  const mm = String(month1to12).padStart(2, "0");
  return `${year}-${mm}-01`;
}

async function main() {
  console.log("🌱 Seeding Referral Deal Room…\n");

  await db.transaction(async (tx) => {
    // Clean slate (dev). Order respects FKs; cascades handle the rest.
    await tx.delete(auditLog);
    await tx.delete(payments);
    await tx.delete(statementLineItems);
    await tx.delete(statements);
    await tx.delete(feeCalculations);
    await tx.delete(revenueEntryDeductions);
    await tx.delete(revenueEntries);
    await tx.delete(referrals);
    await tx.delete(relationshipTerms);
    await tx.delete(relationships);
    await tx.delete(deductionCategories);
    await tx.delete(memberships);
    await tx.delete(organizations);
    await tx.delete(users);

    // --- Orgs -------------------------------------------------------------
    const [orgA, orgB] = await tx
      .insert(organizations)
      .values([
        {
          legalName: "Northstar Agency LLC",
          displayName: "Northstar Agency",
          jurisdiction: "Delaware, USA",
          defaultCurrency: "USD",
          address: { city: "Austin", region: "TX", country: "USA" },
        },
        {
          legalName: "Beacon Studios Inc.",
          displayName: "Beacon Studios",
          jurisdiction: "California, USA",
          defaultCurrency: "USD",
          address: { city: "San Diego", region: "CA", country: "USA" },
        },
      ])
      .returning();

    // --- Users + memberships ---------------------------------------------
    const [alice, bob] = await tx
      .insert(users)
      .values([
        { email: "alice@northstar.example", name: "Alice (Northstar)" },
        { email: "bob@beacon.example", name: "Bob (Beacon)" },
      ])
      .returning();

    await tx.insert(memberships).values([
      { orgId: orgA.id, userId: alice.id, role: "owner" },
      { orgId: orgB.id, userId: bob.id, role: "owner" },
    ]);

    // --- Deduction categories (paying side configures these) -------------
    await tx.insert(deductionCategories).values([
      { orgId: orgB.id, code: "media", label: "Media / ad spend" },
      { orgId: orgB.id, code: "platform", label: "Platform fees" },
      { orgId: orgA.id, code: "media", label: "Media / ad spend" },
      { orgId: orgA.id, code: "transaction", label: "Transaction costs" },
    ]);

    // --- The deal room (one relationship, two directions of terms) -------
    const [rel] = await tx
      .insert(relationships)
      .values({
        orgAId: orgA.id,
        orgBId: orgB.id,
        status: "active",
        createdByUserId: alice.id,
        invitedEmail: "bob@beacon.example",
        invitedAt: new Date("2026-01-05T00:00:00Z"),
        acceptedAt: new Date("2026-01-06T00:00:00Z"),
      })
      .returning();

    // Direction 1: A refers to B → A gets paid, B pays. 25% net / 12 months.
    // Direction 2: B refers to A → B gets paid, A pays. 15% net /  6 months.
    const [termsAtoB, termsBtoA] = await tx
      .insert(relationshipTerms)
      .values([
        {
          relationshipId: rel.id,
          referringOrgId: orgA.id,
          payingOrgId: orgB.id,
          feeBasis: "net_profit",
          feePercentBps: 2500, // 25.00%
          tailMonths: 12,
          currency: "USD",
          effectiveFrom: new Date("2026-01-06T00:00:00Z"),
          createdByUserId: alice.id,
          note: "A→B referrals: 25% of net profit for 12 months.",
        },
        {
          relationshipId: rel.id,
          referringOrgId: orgB.id,
          payingOrgId: orgA.id,
          feeBasis: "net_profit",
          feePercentBps: 1500, // 15.00%
          tailMonths: 6,
          currency: "USD",
          effectiveFrom: new Date("2026-01-06T00:00:00Z"),
          createdByUserId: bob.id,
          note: "B→A referrals: 15% of net profit for 6 months.",
        },
      ])
      .returning();

    // --- Referrals in several states -------------------------------------
    const [refConverted, refAccepted, refSubmitted, refRejected] = await tx
      .insert(referrals)
      .values([
        {
          relationshipId: rel.id,
          submittedByOrgId: orgA.id, // A → B, priced by termsAtoB
          referredClientName: "Cobalt Coffee Co.",
          contactName: "Dana Reyes",
          contactEmail: "dana@cobaltcoffee.example",
          description: "Regional coffee chain wanting a rebrand + paid social.",
          status: "converted",
          submittedByUserId: alice.id,
          submittedAt: new Date("2026-01-10T00:00:00Z"),
          decidedAt: new Date("2026-01-11T00:00:00Z"),
          decidedByUserId: bob.id,
          convertedAt: new Date("2026-02-01T00:00:00Z"), // tail clock starts
        },
        {
          relationshipId: rel.id,
          submittedByOrgId: orgB.id, // B → A, priced by termsBtoA
          referredClientName: "Harbor Logistics",
          contactName: "Sam Okafor",
          contactEmail: "sam@harborlog.example",
          description: "Freight company needing a lead-gen funnel.",
          status: "accepted",
          submittedByUserId: bob.id,
          submittedAt: new Date("2026-02-15T00:00:00Z"),
          decidedAt: new Date("2026-02-16T00:00:00Z"),
          decidedByUserId: alice.id,
        },
        {
          relationshipId: rel.id,
          submittedByOrgId: orgA.id,
          referredClientName: "Juniper Skincare",
          contactName: "Priya Nair",
          contactEmail: "priya@juniper.example",
          description: "DTC skincare brand exploring influencer campaigns.",
          status: "submitted",
          submittedByUserId: alice.id,
          submittedAt: new Date("2026-03-02T00:00:00Z"),
        },
        {
          relationshipId: rel.id,
          submittedByOrgId: orgB.id,
          referredClientName: "Granite Law Group",
          contactName: "Miles Becker",
          contactEmail: "miles@granitelaw.example",
          description: "Law firm — out of A's vertical.",
          status: "rejected",
          submittedByUserId: bob.id,
          submittedAt: new Date("2026-03-04T00:00:00Z"),
          decidedAt: new Date("2026-03-05T00:00:00Z"),
          decidedByUserId: alice.id,
          rejectionReason: "Outside our practice area; can't service well.",
        },
      ])
      .returning();
    void [refAccepted, refSubmitted, refRejected];

    // --- Revenue entries for the converted referral (B logs, B pays) -----
    // Two months of revenue against Cobalt Coffee, both inside the 12-mo tail.
    const revenueMonths = [
      { period: ym(2026, 2), gross: 1_200_000, deductions: [["media", 300_000], ["platform", 50_000]] },
      { period: ym(2026, 3), gross: 1_500_000, deductions: [["media", 400_000], ["platform", 60_000]] },
    ] as const;

    const issuedStatements: { period: string; fee: number; net: number; gross: number; deductions: number }[] = [];

    for (const m of revenueMonths) {
      const deductionTotal = m.deductions.reduce((s, [, amt]) => s + amt, 0);
      const net = m.gross - deductionTotal;

      const [entry] = await tx
        .insert(revenueEntries)
        .values({
          referralId: refConverted.id,
          period: m.period,
          grossRevenue: m.gross,
          netProfit: net,
          currency: "USD",
          status: "active",
          enteredByUserId: bob.id,
          note: `Net billings for ${m.period}`,
        })
        .returning();

      await tx.insert(revenueEntryDeductions).values(
        m.deductions.map(([code, amt]) => ({
          revenueEntryId: entry.id,
          label: code === "media" ? "Media / ad spend" : "Platform fees",
          amount: amt,
        })),
      );

      // Price it with the SAME pure function the Inngest recompute job uses.
      const fee = computeFee(
        {
          feeBasis: termsAtoB.feeBasis,
          feePercentBps: termsAtoB.feePercentBps,
          flatAmount: termsAtoB.flatAmount,
          tailMonths: termsAtoB.tailMonths,
        },
        refConverted.convertedAt!,
        {
          period: new Date(`${m.period}T00:00:00Z`),
          grossRevenue: m.gross,
          netProfit: net,
        },
      );

      const [calc] = await tx
        .insert(feeCalculations)
        .values({
          revenueEntryId: entry.id,
          referralId: refConverted.id,
          relationshipId: rel.id,
          referringOrgId: orgA.id,
          payingOrgId: orgB.id,
          appliedTermsId: termsAtoB.id,
          basis: fee.basis,
          basisAmount: fee.basisAmount,
          appliedPercentBps: fee.appliedPercentBps,
          feeAmount: fee.feeAmount,
          currency: "USD",
          withinTail: fee.withinTail,
          tailStart: fee.tailStart.toISOString().slice(0, 10),
          tailEnd: fee.tailEnd.toISOString().slice(0, 10),
          note: fee.note,
        })
        .returning();

      // Issue a monthly statement for the A→B direction.
      const [stmt] = await tx
        .insert(statements)
        .values({
          relationshipId: rel.id,
          referringOrgId: orgA.id,
          payingOrgId: orgB.id,
          period: m.period,
          currency: "USD",
          status: "issued",
          totalGross: m.gross,
          totalDeductions: deductionTotal,
          totalNet: net,
          totalFee: fee.feeAmount,
          issuedAt: new Date(),
          issuedByUserId: bob.id,
        })
        .returning();

      await tx.insert(statementLineItems).values({
        statementId: stmt.id,
        referralId: refConverted.id,
        referredClientName: refConverted.referredClientName,
        grossRevenue: m.gross,
        deductions: deductionTotal,
        netProfit: net,
        feeAmount: fee.feeAmount,
        feeCalculationId: calc.id,
      });

      issuedStatements.push({
        period: m.period,
        fee: fee.feeAmount,
        net,
        gross: m.gross,
        deductions: deductionTotal,
      });
    }

    // --- A payment against the first statement (partial demo) ------------
    const firstStmt = await tx.query.statements.findFirst({
      where: (s, { eq, and }) =>
        and(eq(s.relationshipId, rel.id), eq(s.period, revenueMonths[0].period)),
    });
    if (firstStmt) {
      await tx.insert(payments).values({
        statementId: firstStmt.id,
        relationshipId: rel.id,
        amount: firstStmt.totalFee,
        currency: "USD",
        paidAt: ym(2026, 3),
        method: "bank_transfer",
        reference: "WIRE-2026-0312",
        recordedByUserId: bob.id,
        note: "Paid in full.",
      });
    }

    // --- Audit log (a few representative events) -------------------------
    await tx.insert(auditLog).values([
      {
        relationshipId: rel.id,
        actorOrgId: orgA.id,
        actorUserId: alice.id,
        entityType: "relationship",
        entityId: rel.id,
        action: "invited",
        summary: "Northstar invited Beacon to a deal room.",
      },
      {
        relationshipId: rel.id,
        actorOrgId: orgB.id,
        actorUserId: bob.id,
        entityType: "relationship",
        entityId: rel.id,
        action: "accepted",
        summary: "Beacon accepted; deal room is active.",
      },
      {
        relationshipId: rel.id,
        actorOrgId: orgB.id,
        actorUserId: bob.id,
        entityType: "referral",
        entityId: refConverted.id,
        action: "approved",
        summary: "Beacon accepted referral: Cobalt Coffee Co.",
      },
      {
        relationshipId: rel.id,
        actorOrgId: orgB.id,
        actorUserId: bob.id,
        entityType: "referral",
        entityId: refConverted.id,
        action: "converted",
        summary: "Cobalt Coffee converted — 12-month fee tail started.",
      },
    ]);

    // --- Console summary --------------------------------------------------
    console.log("Orgs:");
    console.log(`  • ${orgA.displayName} (A)`);
    console.log(`  • ${orgB.displayName} (B)\n`);
    console.log("Deal room terms (roles live HERE, not on the orgs):");
    console.log(
      `  • A→B: Northstar is paid, Beacon pays — 25% net profit, 12-mo tail`,
    );
    console.log(
      `  • B→A: Beacon is paid, Northstar pays — 15% net profit, 6-mo tail\n`,
    );
    console.log("Converted referral 'Cobalt Coffee Co.' (A→B) statements:");
    for (const s of issuedStatements) {
      console.log(
        `  • ${s.period}: gross ${formatMoney(s.gross)}, net ${formatMoney(
          s.net,
        )} → fee ${formatMoney(s.fee)} (25%)`,
      );
    }
    console.log("\n✅ Seed complete.");
  });
}

main()
  .catch((err) => {
    console.error("❌ seed failed", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
