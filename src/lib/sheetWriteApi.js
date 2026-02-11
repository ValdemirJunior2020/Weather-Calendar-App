// src/lib/sheetWriteApi.js
export async function pingApi(scriptUrl) {
  const res = await fetch(scriptUrl);
  return await res.json();
}

export async function upsertAlert(scriptUrl, teamKey, alert) {
  const payload = {
    action: "upsert",
    teamKey: teamKey || "",
    payload: sanitizeAlert(alert),
  };

  const res = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify(payload), // no headers => usually no preflight
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Upsert failed");
  return data.result;
}

export async function deleteAlert(scriptUrl, teamKey, id) {
  const payload = {
    action: "delete",
    teamKey: teamKey || "",
    payload: { id },
  };

  const res = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Delete failed");
  return data.result;
}

function sanitizeAlert(a) {
  const alert = { ...(a || {}) };

  const keep = ["id", "title", "date", "time", "owner", "category", "status", "priority", "notes", "source"];

  const out = {};
  for (const k of keep) {
    if (alert[k] != null) out[k] = alert[k];
  }

  if (!out.date && alert.dateStr) out.date = alert.dateStr;
  if (!out.source) out.source = "sheet";

  return out;
}
