/** Poll endpoint: GET /api/supplyhealth-status?id=... → job state from Netlify Blobs. */
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const id = String(url.searchParams.get("id") || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };
  if (!id) return new Response(JSON.stringify({ status: "error", error: "missing id" }), { status: 400, headers });
  const store = getStore("supplyhealth");
  const data = await store.get(id, { type: "json" });
  if (!data) return new Response(JSON.stringify({ status: "pending" }), { status: 200, headers });
  return new Response(JSON.stringify(data), { status: 200, headers });
};


