import { inngest } from "./client";

/**
 * Fee recomputation handler — SCAFFOLD STUB.
 *
 * In Capability 2 this will, for the referral in the event:
 *   1. Load the referral + its conversion date.
 *   2. Resolve the active terms for the (referring → paying) direction.
 *   3. For each ACTIVE revenue entry, call `computeFee(...)` from
 *      `src/lib/fees.ts` and upsert a `fee_calculations` row.
 *   4. Emit `statement/generate.requested` for affected periods.
 *
 * The pure math already lives in `src/lib/fees.ts` and is exercised by the seed.
 */
export const recomputeFees = inngest.createFunction(
  { id: "recompute-fees" },
  [
    { event: "fees/recompute.requested" },
    { event: "revenue/entry.logged" },
    { event: "revenue/entry.superseded" },
    { event: "referral/converted" },
  ],
  async ({ event, step }) => {
    await step.run("noop-until-capability-2", async () => {
      return { received: event.name, data: event.data };
    });
  },
);

export const functions = [recomputeFees];
