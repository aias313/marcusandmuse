/**
 * Money helpers. Amounts are ALWAYS integer minor units (cents). Percentages
 * are integer basis points (bps): 2500 = 25.00%.
 */

/** Apply a basis-point percentage to a cents amount, rounded to whole cents. */
export function applyBps(amountCents: number, bps: number): number {
  // Round half away from zero so fees don't systematically favor one side.
  const raw = (amountCents * bps) / 10_000;
  return Math.sign(raw) * Math.round(Math.abs(raw));
}

/** Format cents + ISO currency for display. */
export function formatMoney(amountCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`;
}
