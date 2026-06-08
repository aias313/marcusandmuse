import Link from "next/link";

/**
 * Landing placeholder. This is a SCAFFOLD CHECKPOINT — the deal room features
 * (submission/approval, fees, statements, payments) are intentionally not built
 * yet, pending schema review.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Referral Deal Room
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          A shared workspace for referral partnerships
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Two businesses, one deal room. Refer prospects, approve submissions,
          track converted revenue, and see identical fee statements — with an
          append-only audit trail both sides can trust.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Scaffold checkpoint</p>
        <p className="mt-1">
          The project, schema, and seed are in place. Roles are modeled on the
          relationship&rsquo;s terms (not on accounts). Review{" "}
          <code className="rounded bg-amber-100 px-1">SCHEMA.md</code> before we
          build features.
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <Link
          href="/sign-in"
          className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
        >
          Dashboard (coming next)
        </Link>
      </div>
    </main>
  );
}
