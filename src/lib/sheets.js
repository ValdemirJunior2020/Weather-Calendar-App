import Papa from "papaparse";
import { safeStr } from "./utils.js";
import { parseDateFlexible } from "./dates.js";

/**
 * Front-end only Google Sheet read:
 * https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1
 */
export function makeGvizCsvUrl(sheetId, sheetName = "Sheet1") {
  const id = encodeURIComponent(sheetId);
  const sh = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${sh}`;
}

export async function fetchCsv(url, { timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function normalizeHeaders(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = safeStr(k).toLowerCase();
    out[key] = v;
  }
  return out;
}

export function rowsToAlerts(rows) {
  const alerts = [];
  for (const raw of rows) {
    const r = normalizeHeaders(raw);

    const title =
      safeStr(r.title) ||
      safeStr(r.event) ||
      safeStr(r.name) ||
      safeStr(r.subject) ||
      safeStr(r["action item"]) ||
      safeStr(r["action"]) ||
      "";

    const dateStr =
      safeStr(r.date) ||
      safeStr(r["due date"]) ||
      safeStr(r["start date"]) ||
      safeStr(r["event date"]) ||
      "";

    const time =
      safeStr(r.time) ||
      safeStr(r["event time"]) ||
      safeStr(r["start time"]) ||
      "";

    const owner =
      safeStr(r.owner) ||
      safeStr(r["assigned to"]) ||
      safeStr(r.assignee) ||
      "";

    const status = safeStr(r.status) || safeStr(r.state) || "Planned";
    const category = safeStr(r.category) || safeStr(r.type) || "General";
    const priority = safeStr(r.priority) || "Normal";

    const notes =
      safeStr(r.notes) ||
      safeStr(r.description) ||
      safeStr(r.details) ||
      safeStr(r.summary) ||
      "";

    const dateObj = parseDateFlexible(dateStr);

    if (!title && !dateStr && !notes) continue;

    alerts.push({
      id: crypto.randomUUID(),
      source: "sheet",
      title: title || "(Untitled)",
      dateStr,
      dateObj,
      time,
      owner,
      status,
      category,
      priority,
      notes,
      raw: raw
    });
  }
  return alerts;
}

export async function loadAlertsFromGoogleSheet({ sheetId, sheetName, customCsvUrl } = {}) {
  const csvUrl = customCsvUrl || makeGvizCsvUrl(sheetId, sheetName);
  const csv = await fetchCsv(csvUrl);

  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

  if (parsed.errors?.length) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error: ${first?.message || "unknown"}`);
  }

  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return { alerts: rowsToAlerts(rows), csvUrl };
}
