/**
 * Core fee-calculation domain logic — PURE and side-effect free so it can be
 * unit-tested and reused by both the Inngest recompute job and the seed.
 *
 * The fee for a single revenue entry depends on:
 *   1. The terms active for the relevant DIRECTION (referring → paying).
 *   2. Whether the entry's accounting period falls inside the fee tail window
 *      that starts at the referral's conversion month and runs `tailMonths`.
 *   3. The fee basis: a percentage of net profit / gross revenue, or a flat fee.
 */
import { applyBps } from "./money";

export type FeeBasis = "net_profit" | "gross_revenue" | "flat";

export interface TermsInput {
  feeBasis: FeeBasis;
  feePercentBps: number | null;
  flatAmount: number | null; // cents
  tailMonths: number;
}

export interface RevenueInput {
  /** First day of the accounting month, e.g. new Date("2026-03-01"). */
  period: Date;
  grossRevenue: number; // cents
  netProfit: number; // cents
}

export interface FeeResult {
  withinTail: boolean;
  tailStart: Date;
  tailEnd: Date; // exclusive
  basis: FeeBasis;
  basisAmount: number; // cents the percentage was applied to
  appliedPercentBps: number | null;
  feeAmount: number; // cents
  note: string | null;
}

/** Normalize any date to the first day of its month (UTC). */
export function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Add N months to a UTC month-start. */
export function addMonthsUTC(d: Date, months: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
}

/**
 * Compute the fee owed for one revenue entry.
 *
 * Tail window: [conversionMonth, conversionMonth + tailMonths). A period equal
 * to the conversion month counts; the month exactly `tailMonths` later does not.
 */
export function computeFee(
  terms: TermsInput,
  convertedAt: Date,
  revenue: RevenueInput,
): FeeResult {
  const tailStart = startOfMonthUTC(convertedAt);
  const tailEnd = addMonthsUTC(tailStart, terms.tailMonths);
  const period = startOfMonthUTC(revenue.period);

  const withinTail =
    period.getTime() >= tailStart.getTime() &&
    period.getTime() < tailEnd.getTime();

  if (!withinTail) {
    return {
      withinTail: false,
      tailStart,
      tailEnd,
      basis: terms.feeBasis,
      basisAmount: 0,
      appliedPercentBps: terms.feePercentBps,
      feeAmount: 0,
      note: "Period falls outside the fee tail window; no fee accrues.",
    };
  }

  if (terms.feeBasis === "flat") {
    return {
      withinTail: true,
      tailStart,
      tailEnd,
      basis: "flat",
      basisAmount: 0,
      appliedPercentBps: null,
      feeAmount: terms.flatAmount ?? 0,
      note: null,
    };
  }

  const basisAmount =
    terms.feeBasis === "net_profit" ? revenue.netProfit : revenue.grossRevenue;
  const bps = terms.feePercentBps ?? 0;

  return {
    withinTail: true,
    tailStart,
    tailEnd,
    basis: terms.feeBasis,
    basisAmount,
    appliedPercentBps: bps,
    feeAmount: applyBps(basisAmount, bps),
    note: null,
  };
}
