/**
 * Tenant isolation — query-layer scoping.
 *
 * SECURITY REQUIREMENT: a user must never see a deal room their orgs aren't a
 * party to. Every data-access path resolves the caller's org memberships from
 * Clerk and constrains queries to relationships those orgs belong to. This
 * module centralizes that guard so individual queries can't forget it.
 *
 * (An optional Postgres RLS policy set — see `src/db/policies.sql` — adds
 * defense-in-depth so a bug in application code can't leak across tenants.)
 */
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { memberships, organizations, relationships, users } from "@/db/schema";

export interface TenantContext {
  userId: string; // internal users.id
  clerkUserId: string;
  /** Internal organizations.id values the caller belongs to. */
  orgIds: string[];
  /** The currently active org from Clerk's org switcher, if any. */
  activeOrgId: string | null;
}

/**
 * Resolve the caller's tenant context from Clerk. Throws if unauthenticated.
 * Maps Clerk ids → our internal ids via the synced `users`/`organizations`.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const { userId: clerkUserId, orgId: clerkActiveOrgId } = await auth();
  if (!clerkUserId) {
    throw new Error("UNAUTHENTICATED");
  }

  // Look the caller up by Clerk id, then gather their org memberships. This is
  // the real shape; it depends on the Clerk→DB sync (webhook) that lands with
  // feature work, so it is exercised end-to-end starting in Capability 1.
  const rows = await db
    .select({
      userId: users.id,
      orgId: memberships.orgId,
      clerkOrgId: organizations.clerkOrgId,
    })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(users.clerkUserId, clerkUserId));

  if (rows.length === 0) {
    throw new Error("UNAUTHENTICATED: user not synced");
  }

  const activeOrgId =
    rows.find((r) => r.clerkOrgId === clerkActiveOrgId)?.orgId ?? null;

  return {
    userId: rows[0].userId,
    clerkUserId,
    orgIds: [...new Set(rows.map((r) => r.orgId))],
    activeOrgId,
  };
}

/**
 * Returns a Drizzle `where` predicate that limits `relationships` to rooms the
 * given org ids are a party to (either side). Use on EVERY relationship-scoped
 * query.
 */
export function relationshipVisibleTo(orgIds: string[]) {
  return or(
    inArray(relationships.orgAId, orgIds),
    inArray(relationships.orgBId, orgIds),
  );
}

/** Assert an org is a party to a relationship before any mutation. */
export async function assertPartyToRelationship(
  relationshipId: string,
  orgIds: string[],
): Promise<void> {
  const [row] = await db
    .select({ id: relationships.id })
    .from(relationships)
    .where(
      and(
        eq(relationships.id, relationshipId),
        relationshipVisibleTo(orgIds),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error("FORBIDDEN: not a party to this deal room");
  }
}
