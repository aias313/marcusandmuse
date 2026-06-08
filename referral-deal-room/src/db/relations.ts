/**
 * Drizzle relational-query wiring. Kept separate from `schema.ts` so the table
 * definitions stay focused on columns/constraints.
 */
import { relations } from "drizzle-orm";
import {
  auditLog,
  contracts,
  deductionCategories,
  feeCalculations,
  memberships,
  organizations,
  payments,
  referrals,
  relationshipTerms,
  relationships,
  revenueEntries,
  revenueEntryDeductions,
  statementDeductions,
  statements,
  users,
} from "./schema";

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const relationshipsRelations = relations(
  relationships,
  ({ one, many }) => ({
    orgA: one(organizations, {
      fields: [relationships.orgAId],
      references: [organizations.id],
      relationName: "orgA",
    }),
    orgB: one(organizations, {
      fields: [relationships.orgBId],
      references: [organizations.id],
      relationName: "orgB",
    }),
    terms: many(relationshipTerms),
    referrals: many(referrals),
    statements: many(statements),
    payments: many(payments),
    contracts: many(contracts),
  }),
);

export const relationshipTermsRelations = relations(
  relationshipTerms,
  ({ one }) => ({
    relationship: one(relationships, {
      fields: [relationshipTerms.relationshipId],
      references: [relationships.id],
    }),
    referringOrg: one(organizations, {
      fields: [relationshipTerms.referringOrgId],
      references: [organizations.id],
      relationName: "referringOrg",
    }),
    payingOrg: one(organizations, {
      fields: [relationshipTerms.payingOrgId],
      references: [organizations.id],
      relationName: "payingOrg",
    }),
  }),
);

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  relationship: one(relationships, {
    fields: [referrals.relationshipId],
    references: [relationships.id],
  }),
  submittedByOrg: one(organizations, {
    fields: [referrals.submittedByOrgId],
    references: [organizations.id],
  }),
  revenueEntries: many(revenueEntries),
}));

export const revenueEntriesRelations = relations(
  revenueEntries,
  ({ one, many }) => ({
    referral: one(referrals, {
      fields: [revenueEntries.referralId],
      references: [referrals.id],
    }),
    deductions: many(revenueEntryDeductions),
    feeCalculation: one(feeCalculations, {
      fields: [revenueEntries.id],
      references: [feeCalculations.revenueEntryId],
    }),
  }),
);

export const revenueEntryDeductionsRelations = relations(
  revenueEntryDeductions,
  ({ one }) => ({
    revenueEntry: one(revenueEntries, {
      fields: [revenueEntryDeductions.revenueEntryId],
      references: [revenueEntries.id],
    }),
    category: one(deductionCategories, {
      fields: [revenueEntryDeductions.categoryId],
      references: [deductionCategories.id],
    }),
  }),
);

export const feeCalculationsRelations = relations(
  feeCalculations,
  ({ one }) => ({
    revenueEntry: one(revenueEntries, {
      fields: [feeCalculations.revenueEntryId],
      references: [revenueEntries.id],
    }),
    referral: one(referrals, {
      fields: [feeCalculations.referralId],
      references: [referrals.id],
    }),
    appliedTerms: one(relationshipTerms, {
      fields: [feeCalculations.appliedTermsId],
      references: [relationshipTerms.id],
    }),
  }),
);

export const statementsRelations = relations(statements, ({ one, many }) => ({
  relationship: one(relationships, {
    fields: [statements.relationshipId],
    references: [relationships.id],
  }),
  referral: one(referrals, {
    fields: [statements.referralId],
    references: [referrals.id],
  }),
  deductions: many(statementDeductions),
  payments: many(payments),
}));

export const statementDeductionsRelations = relations(
  statementDeductions,
  ({ one }) => ({
    statement: one(statements, {
      fields: [statementDeductions.statementId],
      references: [statements.id],
    }),
    category: one(deductionCategories, {
      fields: [statementDeductions.categoryId],
      references: [deductionCategories.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  statement: one(statements, {
    fields: [payments.statementId],
    references: [statements.id],
  }),
  relationship: one(relationships, {
    fields: [payments.relationshipId],
    references: [relationships.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  relationship: one(relationships, {
    fields: [auditLog.relationshipId],
    references: [relationships.id],
  }),
  actorOrg: one(organizations, {
    fields: [auditLog.actorOrgId],
    references: [organizations.id],
  }),
  actorUser: one(users, {
    fields: [auditLog.actorUserId],
    references: [users.id],
  }),
}));
