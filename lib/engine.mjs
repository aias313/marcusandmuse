/**
 * Supply Health engine — ads.txt / app-ads.txt validation against exchange sellers.json.
 * Node port of the Marcus and Muse audit engine, tuned for Netlify background functions
 * (generous budgets, streaming parse for very large sellers.json files).
 */
import { Readable } from "node:stream";
import StreamJson from "stream-json";
import PickPkg from "stream-json/filters/Pick.js";
import StreamArrayPkg from "stream-json/streamers/StreamArray.js";
import ChainPkg from "stream-chain";

const { parser } = StreamJson;
const { pick } = PickPkg;
const { streamArray } = StreamArrayPkg;
const { chain } = ChainPkg;

const UA = "MarcusMuse-SupplyHealth/1.0 (+https://marcusandmuse.com/tools/supplyhealth; supply-chain check)";
const ADS_TIMEOUT_MS = 15_000;
const SELLERS_FETCH_TIMEOUT_MS = 150_000;  // per sellers.json, wall clock
const MAX_EXCHANGES = 150;
const WORKERS = 10;

const VALID_RELATIONSHIPS = new Set(["DIRECT", "RESELLER"]);
const KNOWN_VARIABLES = new Set(["CONTACT", "SUBDOMAIN", "INVENTORYPARTNERDOMAIN", "OWNERDOMAIN", "MANAGERDOMAIN"]);
const SPECIAL_SELLERS_URLS = {
  "google.com": "https://storage.googleapis.com/adx-rtb-dictionaries/sellers.json",
  "advertising.com": "https://dragon-advertising.com/sellers.json",
};
const TYPE_OK = { DIRECT: new Set(["PUBLISHER", "BOTH"]), RESELLER: new Set(["INTERMEDIARY", "BOTH"]) };

export const VERIFIED = "verified", TYPE_MISMATCH = "type_mismatch", NOT_LISTED = "not_listed",
  UNVERIFIABLE = "unverifiable", SKIPPED = "skipped";

export function normalizeDomain(raw) {
  let d = String(raw || "").trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, "").split("/")[0].split("?")[0].split(":")[0];
  return d.replace(/^www\./, "");
}

// ------------------------------------------------------------------ parse --

export function parseAdsTxt(text) {
  const out = { records: [], variables: {}, parse_errors: [], duplicates: [], total_lines: 0 };
  const seen = new Map();
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].split("#")[0].trim();
    if (!line) continue;
    out.total_lines++;
    const eq = line.indexOf("=");
    if (eq > 0 && !line.slice(0, eq).includes(",")) {
      const name = line.slice(0, eq).trim().toUpperCase();
      const value = line.slice(eq + 1).trim();
      (out.variables[name] ||= []).push(value);
      if (!KNOWN_VARIABLES.has(name))
        out.parse_errors.push({ line: lineNo, raw: line.slice(0, 200), reason: `unknown variable '${name}'` });
      continue;
    }
    const parts = line.split(",").map(p => p.trim());
    if (parts.length < 3) {
      out.parse_errors.push({ line: lineNo, raw: line.slice(0, 200), reason: "fewer than 3 fields" });
      continue;
    }
    const exchange = parts[0].toLowerCase(), id = parts[1], rel = parts[2].toUpperCase();
    if (!VALID_RELATIONSHIPS.has(rel)) {
      out.parse_errors.push({ line: lineNo, raw: line.slice(0, 200), reason: `invalid relationship '${parts[2]}'` });
      continue;
    }
    if (!exchange.includes(".") || exchange.includes(" ")) {
      out.parse_errors.push({ line: lineNo, raw: line.slice(0, 200), reason: `invalid exchange domain '${exchange}'` });
      continue;
    }
    const key = `${exchange}\u0000${id}\u0000${rel}`;
    if (seen.has(key)) {
      out.duplicates.push({ line: lineNo, raw: line.slice(0, 200), first_seen_line: seen.get(key) });
      continue;
    }
    seen.set(key, lineNo);
    out.records.push({ line: lineNo, exchange, id, rel, cert: parts[3] || null });
  }
  return out;
}

async function fetchText(url, timeoutMs) {
  const resp = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  return resp;
}

export async function fetchAdsTxt(domain, app) {
  const fname = app ? "app-ads.txt" : "ads.txt";
  let lastErr = null;
  for (const host of [`https://${domain}`, `https://www.${domain}`, `http://${domain}`]) {
    const url = `${host}/${fname}`;
    try {
      const resp = await fetchText(url, ADS_TIMEOUT_MS);
      if (resp.status === 200) {
        const text = await resp.text();
        if (!text.trim()) { lastErr = "empty file"; continue; }
        if (text.slice(0, 400).toLowerCase().includes("<html")) {
          lastErr = "server returned an HTML page instead of a plain-text file";
          continue;
        }
        return { ads: parseAdsTxt(text), url, error: null };
      }
      if (resp.status === 404 || resp.status === 410) lastErr = `HTTP ${resp.status}`;
    } catch (e) {
      lastErr = e.name === "TimeoutError" ? "timed out" : e.name;
    }
  }
  return { ads: null, url: `https://${domain}/${fname}`, error: lastErr };
}

// ----------------------------------------------------------- sellers.json --

export async function fetchSellers(exchange, wantedIds) {
  const url = SPECIAL_SELLERS_URLS[exchange] || `https://${exchange}/sellers.json`;
  const res = { exchange, url, status: "error", matched: {}, total: null, complete: true, error: null };
  const wanted = new Set([...wantedIds].map(w => w.trim()));
  const t0 = Date.now();
  let body = null;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(SELLERS_FETCH_TIMEOUT_MS),
    });
    if (resp.status !== 200) {
      res.status = (resp.status === 404 || resp.status === 410) ? "not_found" : "error";
      res.error = `HTTP ${resp.status}`;
      return res;
    }
    body = Readable.fromWeb(resp.body);
    // chain() propagates errors from any stage (bad JSON, dropped connection)
    // to the iterator instead of crashing the process like bare .pipe() does.
    const pipeline = chain([body, parser(), pick({ filter: "sellers" }), streamArray()]);
    let count = 0;
    for await (const { value: obj } of pipeline) {
      count++;
      const sid = String(obj?.seller_id ?? "").trim();
      if (wanted.has(sid)) {
        res.matched[sid] = {
          name: obj.name ?? null,
          domain: obj.domain || null,
          type: String(obj.seller_type || "").toUpperCase() || null,
          confidential: Boolean(Number(obj.is_confidential ?? 0)),
          passthrough: Boolean(Number(obj.is_passthrough ?? 0)),
        };
      }
      if (count % 5000 === 0 && Date.now() - t0 > SELLERS_FETCH_TIMEOUT_MS) {
        res.complete = false;
        body.destroy();
        break;
      }
    }
    res.total = count;
    res.status = "ok";
  } catch (e) {
    if (body) try { body.destroy(); } catch {}
    if (e.name === "TimeoutError" || e.name === "AbortError") {
      // Partial scan still counts if we matched things; mark incomplete.
      if (Object.keys(res.matched).length || res.total) {
        res.status = "ok"; res.complete = false;
      } else {
        res.status = "error"; res.error = "timed out";
      }
    } else if (e instanceof SyntaxError || /json|parser|unexpected/i.test(String(e.message))) {
      res.status = "invalid"; res.error = "invalid JSON";
    } else {
      res.status = "error"; res.error = e.name || "fetch failed";
    }
  }
  return res;
}

export async function fetchAllSellers(records, { onProgress } = {}) {
  const byExchange = new Map();
  for (const rec of records) {
    if (!byExchange.has(rec.exchange)) byExchange.set(rec.exchange, new Set());
    byExchange.get(rec.exchange).add(rec.id);
  }
  const ordered = [...byExchange.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, MAX_EXCHANGES);
  const out = {};
  let done = 0;
  const queue = [...ordered];
  async function worker() {
    while (queue.length) {
      const [exchange, ids] = queue.shift();
      out[exchange] = await fetchSellers(exchange, ids);
      done++;
      if (onProgress) { try { await onProgress(done, ordered.length, exchange); } catch {} }
    }
  }
  await Promise.all(Array.from({ length: Math.min(WORKERS, ordered.length) }, worker));
  for (const [exchange] of byExchange) {
    if (!out[exchange]) out[exchange] = {
      exchange, url: "", status: "skipped", matched: {}, total: null,
      complete: true, error: "exchange cap reached",
    };
  }
  return out;
}

// ------------------------------------------------------- validate + score --

export function crossValidate(records, sellers) {
  return records.map(rec => {
    const sj = sellers[rec.exchange];
    const c = { exchange: rec.exchange, id: rec.id, rel: rec.rel, state: SKIPPED,
      name: null, domain: null, type: null, confidential: false, passthrough: false, note: null };
    if (sj && sj.status === "skipped") {
      c.note = "not checked (exchange cap)";
    } else if (!sj || sj.status !== "ok") {
      c.state = UNVERIFIABLE;
      c.note = sj?.error || "no valid sellers.json";
    } else {
      const entry = sj.matched[rec.id.trim()];
      if (!entry) {
        if (!sj.complete) {
          c.state = UNVERIFIABLE;
          c.note = "sellers.json too large to fully scan";
        } else {
          c.state = NOT_LISTED;
          c.note = "seller_id absent from exchange sellers.json";
        }
      } else {
        Object.assign(c, { name: entry.name, domain: entry.domain, type: entry.type,
          confidential: entry.confidential, passthrough: entry.passthrough });
        if (entry.type && !TYPE_OK[rec.rel]?.has(entry.type)) {
          c.state = TYPE_MISMATCH;
          c.note = `declared ${rec.rel} but sellers.json lists type ${entry.type}`;
        } else {
          c.state = VERIFIED;
        }
      }
    }
    return c;
  });
}

export const gradeFor = s => s >= 85 ? "A" : s >= 70 ? "B" : s >= 55 ? "C" : s >= 40 ? "D" : "F";

export function score(ads, fname, sellers, checks, fetchError) {
  const cats = [], findings = [];
  if (!ads) {
    cats.push(
      { name: "File hygiene", points: 0, max: 20, detail: `${fname} missing or unreachable` },
      { name: "Seller reciprocity", points: 0, max: 35, detail: "no records to verify" },
      { name: "Path directness", points: 0, max: 20, detail: "no records" },
      { name: "Transparency", points: 0, max: 15, detail: "no records" },
      { name: "Exchange infrastructure", points: 0, max: 10, detail: "no exchanges declared" });
    findings.push({ severity: "critical", title: `No ${fname} found`,
      detail: `Could not retrieve the file (${fetchError || "not found"}). Buyers applying ${fname} ` +
        "filtering will treat all programmatic inventory from this domain as unauthorized." });
    return { cats, findings, stats: {} };
  }

  const recs = ads.records;
  const n = Math.max(1, recs.length + ads.parse_errors.length + ads.duplicates.length);
  let hygiene = 8
    + 6 * Math.max(0, 1 - (ads.parse_errors.length / n) * 5)
    + 3 * Math.max(0, 1 - (ads.duplicates.length / n) * 5);
  const hasOwner = "OWNERDOMAIN" in ads.variables;
  if (hasOwner) hygiene += 3;
  cats.push({ name: "File hygiene", points: round1(hygiene), max: 20,
    detail: `${recs.length} valid records, ${ads.parse_errors.length} syntax errors, ${ads.duplicates.length} duplicates` });
  if (ads.parse_errors.length)
    findings.push({ severity: "medium", title: `${ads.parse_errors.length} malformed line(s)`,
      detail: ads.parse_errors.slice(0, 5).map(e => `line ${e.line}: ${e.reason}`).join("; ")
        + (ads.parse_errors.length > 5 ? "…" : "") });
  if (ads.duplicates.length)
    findings.push({ severity: "low", title: `${ads.duplicates.length} duplicate entrie(s)`,
      detail: "Duplicates add crawler noise and signal poor file maintenance." });
  if (!hasOwner)
    findings.push({ severity: "low", title: "No OWNERDOMAIN declared",
      detail: "ads.txt 1.1 OWNERDOMAIN helps buyers attribute inventory ownership." });

  const counted = checks.filter(c => c.state !== SKIPPED);
  const verified = counted.filter(c => c.state === VERIFIED);
  const mismatched = counted.filter(c => c.state === TYPE_MISMATCH);
  const notListed = counted.filter(c => c.state === NOT_LISTED);
  const unverifiable = counted.filter(c => c.state === UNVERIFIABLE);
  const skipped = checks.filter(c => c.state === SKIPPED);
  const checkable = verified.length + mismatched.length + notListed.length;

  const recip = checkable ? 35 * (verified.length + 0.5 * mismatched.length) / checkable : 0;
  cats.push({ name: "Seller reciprocity", points: round1(recip), max: 35,
    detail: `${verified.length}/${checkable} entries confirmed in exchange sellers.json files`
      + (unverifiable.length ? `; ${unverifiable.length} unverifiable` : "")
      + (skipped.length ? `; ${skipped.length} not checked` : "") });
  if (notListed.length) {
    const sample = notListed.slice(0, 6).map(c => `${c.exchange}:${c.id}`).join(", ")
      + (notListed.length > 6 ? "…" : "");
    findings.push({ severity: "high",
      title: `${notListed.length} seller ID(s) not found in exchange sellers.json`,
      detail: `Declared in ${fname} but absent from the exchange's own seller list (${sample}). ` +
        "Stale entries, typos, or unauthorized declarations. Buyers running full-path validation discount these paths." });
  }
  if (mismatched.length)
    findings.push({ severity: "medium", title: `${mismatched.length} relationship type mismatch(es)`,
      detail: mismatched.slice(0, 4).map(c => `${c.exchange}:${c.id} (${c.note})`).join("; ") });

  const direct = recs.filter(r => r.rel === "DIRECT");
  const ratio = recs.length ? direct.length / recs.length : 0;
  cats.push({ name: "Path directness", points: round1(20 * Math.min(1, ratio / 0.5)), max: 20,
    detail: `${direct.length} DIRECT / ${recs.length - direct.length} RESELLER (${Math.round(ratio * 100)}% direct)` });
  if (recs.length && ratio < 0.25)
    findings.push({ severity: "medium", title: "Reseller-heavy supply path",
      detail: `Only ${Math.round(ratio * 100)}% of declared paths are DIRECT. Long reseller chains ` +
        "raise take-rate leakage and SPO exclusion risk." });

  const matched = [...verified, ...mismatched];
  let transparency = 0, tdetail = "no matched sellers to evaluate";
  if (matched.length) {
    const conf = matched.filter(c => c.confidential);
    const pt = matched.filter(c => c.passthrough);
    const anon = matched.filter(c => !c.confidential && !(c.name && c.domain));
    const bad = conf.length + pt.length + 0.5 * anon.length;
    transparency = 15 * Math.max(0, 1 - bad / matched.length);
    tdetail = `${conf.length} confidential, ${pt.length} passthrough, ${anon.length} missing name/domain of ${matched.length} matched`;
    if (conf.length)
      findings.push({ severity: "medium", title: `${conf.length} confidential seller record(s)`,
        detail: "Listed with is_confidential=1, hiding seller identity from buyers. A common SPO red flag." });
  }
  cats.push({ name: "Transparency", points: round1(transparency), max: 15, detail: tdetail });

  const fetched = Object.values(sellers).filter(s => s.status !== "skipped");
  const ok = fetched.filter(s => s.status === "ok");
  const infra = fetched.length ? 10 * ok.length / fetched.length : 0;
  const badExch = fetched.filter(s => s.status !== "ok").map(s => s.exchange).sort();
  cats.push({ name: "Exchange infrastructure", points: round1(infra), max: 10,
    detail: `${ok.length}/${fetched.length} checked exchanges serve a valid sellers.json` });
  if (badExch.length)
    findings.push({ severity: "medium",
      title: `${badExch.length} exchange(s) with no valid sellers.json`,
      detail: badExch.slice(0, 8).join(", ") + (badExch.length > 8 ? "…" : "")
        + ". Paths through these systems cannot be validated end-to-end." });

  if (!findings.length)
    findings.push({ severity: "info", title: "No material issues found",
      detail: "Supply declarations are clean, reciprocal, and verifiable." });

  const stats = { records: recs.length, exchanges: Object.keys(sellers).length,
    verified: verified.length, type_mismatch: mismatched.length, not_listed: notListed.length,
    unverifiable: unverifiable.length, skipped: skipped.length,
    direct_ratio: Math.round(ratio * 1000) / 1000 };
  return { cats, findings, stats };
}

const round1 = x => Math.round(x * 10) / 10;

// ------------------------------------------------------------------ entry --

export async function runAudit(payload, { onProgress } = {}) {
  const t0 = Date.now();
  const app = Boolean(payload.app);
  const fname = app ? "app-ads.txt" : "ads.txt";
  const domain = normalizeDomain(payload.domain || "");
  const content = String(payload.content || "").trim();

  if (!domain && !content)
    return { error: "Provide a domain or paste the contents of an ads.txt / app-ads.txt file." };
  if (content.length > 2_000_000)
    return { error: "Pasted file is too large (2MB limit)." };

  let ads = null, source = "pasted", fetchError = null;
  if (content) {
    ads = parseAdsTxt(content);
  } else {
    const r = await fetchAdsTxt(domain, app);
    ads = r.ads; source = r.url; fetchError = r.error;
  }

  let sellers = {}, checks = [];
  if (ads?.records?.length) {
    sellers = await fetchAllSellers(ads.records, { onProgress });
    checks = crossValidate(ads.records, sellers);
  }

  const { cats, findings, stats } = score(ads, fname, sellers, checks, fetchError);
  const total = round1(cats.reduce((a, c) => a + c.points, 0));
  const sevRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => (sevRank[a.severity] ?? 5) - (sevRank[b.severity] ?? 5));
  return {
    domain: domain || null, file: fname, source,
    score: total, grade: gradeFor(total),
    categories: cats, findings, checks, stats,
    variables: ads?.variables || {},
    elapsed: Math.round((Date.now() - t0) / 100) / 10,
    checked_at: new Date().toISOString(),
  };
}
