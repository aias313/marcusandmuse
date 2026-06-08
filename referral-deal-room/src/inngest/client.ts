import { EventSchemas, Inngest } from "inngest";

/**
 * Inngest event contract. These events drive fee recomputation, statement
 * generation, and notification fan-out (Capabilities 2 & 1). Defined now so the
 * wiring exists; the handlers are implemented with their features.
 */
type Events = {
  "referral/converted": { data: { referralId: string } };
  "revenue/entry.logged": {
    data: { revenueEntryId: string; referralId: string };
  };
  "revenue/entry.superseded": { data: { referralId: string } };
  "terms/changed": { data: { relationshipId: string } };
  "fees/recompute.requested": { data: { referralId: string } };
  "statement/generate.requested": {
    data: { relationshipId: string; period: string };
  };
};

export const inngest = new Inngest({
  id: "referral-deal-room",
  schemas: new EventSchemas().fromRecord<Events>(),
});
