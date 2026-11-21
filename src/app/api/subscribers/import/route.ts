import { withUser } from "@/lib/api";
import { isAllowedPushEndpoint } from "@/lib/push/webpush";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

/** Minimal CSV parser: handles quoted fields, embedded commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

function findColumn(headers: string[], patterns: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const p of patterns) {
    const idx = lower.findIndex((h) => h === p || h.includes(p));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * POST /api/subscribers/import — migration import (G1).
 * Body: { siteId, source: 'onesignal'|'pushengage'|'generic', csv }
 * Imported rows are stored as non-deliverable audience records: a push
 * subscription is bound to the VAPID key it was created with, so these
 * endpoints cannot receive PushKit sends until the browser re-subscribes
 * (the SDK migration mode does that automatically for returning visitors).
 */
export async function POST(request: Request) {
  return withUser(async () => {
    let body: { siteId?: string; source?: string; csv?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.siteId || !body.csv) return jsonError("siteId and csv required", 400);
    if (body.csv.length > 5_000_000) return jsonError("CSV too large (5 MB max)", 413);
    const store = await getStore();
    const site = await store.getSite(body.siteId);
    if (!site) return jsonError("Site not found", 404);

    const rows = parseCsv(body.csv);
    if (rows.length < 2) return jsonError("CSV needs a header row and at least one data row", 400);
    const headers = rows[0];
    const endpointCol = findColumn(headers, ["identifier", "endpoint", "subscription", "url"]);
    const p256dhCol = findColumn(headers, ["web_p256dh", "p256dh"]);
    const authCol = findColumn(headers, ["web_auth", "auth"]);
    if (endpointCol < 0 || p256dhCol < 0 || authCol < 0) {
      return jsonError("Could not find endpoint / p256dh / auth columns in the CSV header", 400);
    }

    const parsed: { endpoint: string; p256dh: string; auth: string }[] = [];
    let invalid = 0;
    for (const row of rows.slice(1)) {
      const endpoint = (row[endpointCol] ?? "").trim();
      const p256dh = (row[p256dhCol] ?? "").trim();
      const auth = (row[authCol] ?? "").trim();
      if (!endpoint || !p256dh || !auth || !isAllowedPushEndpoint(endpoint)) { invalid++; continue; }
      parsed.push({ endpoint, p256dh, auth });
    }
    if (parsed.length > 20000) return jsonError("Import is limited to 20,000 rows per file", 413);

    const source = ["onesignal", "pushengage", "generic"].includes(body.source ?? "")
      ? (body.source as string)
      : "generic";
    const result = await store.importSubscribers(site.id, parsed, source);
    return Response.json({ ok: true, ...result, invalid, total: rows.length - 1 });
  });
}
