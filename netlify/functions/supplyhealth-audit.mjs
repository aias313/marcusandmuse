/**
 * Background function: runs the full supply-chain audit (up to 15 min),
 * writing progress and the final result to Netlify Blobs under the job id.
 * Returns an empty 202 to the client immediately; the page polls
 * /api/supplyhealth-status for the outcome.
 */
import { getStore } from "@netlify/blobs";
import { runAudit } from "../../lib/engine.mjs";

export default async (req) => {
  let payload = {};
  try { payload = await req.json(); } catch {}
  const id = String(payload.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!id) return; // nothing to report against

  const store = getStore("supplyhealth");
  const write = (data) => store.setJSON(id, { ...data, updated: Date.now() });

  try {
    await write({ status: "running", phase: "fetching the file" });
    let lastWrite = 0;
    const result = await runAudit(payload, {
      onProgress: async (done, total) => {
        const now = Date.now();
        if (now - lastWrite > 1500 || done === total) {
          lastWrite = now;
          await write({ status: "running", phase: "checking exchanges", done, total });
        }
      },
    });
    if (result.error) await write({ status: "error", error: result.error });
    else await write({ status: "done", result });
  } catch (e) {
    // Catch everything: an unhandled throw would trigger Netlify's automatic
    // retries and re-crawl the same job.
    await write({ status: "error",
      error: `Audit failed unexpectedly (${e?.name || "Error"}). Try again.` }).catch(() => {});
  }
};

export const config = { background: true };
