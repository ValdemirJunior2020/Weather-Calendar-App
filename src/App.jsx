// FILE: src/App.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import WeatherCard from "./components/WeatherCard";

const STORAGE_KEY = "alert_events_settings_v1";

const DEFAULT_SETTINGS = {
  webAppUrl: "https://script.google.com/macros/s/AKfycbxi3-Ga_QJD9uxlpodG9_3V_P2S0TBng6txzPLU8j8NK1oJZ37niRN8scc-zffwFTO7/exec",
  teamKey: "",
  syncMinutes: 10,
  leadDays: 1,
  notificationsEnabled: false,
  weatherLat: 26.6168,
  weatherLon: -80.0684,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function toLocalIsoDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseWhenDate(whenVal) {
  if (!whenVal) return null;
  if (whenVal instanceof Date) return whenVal;

  const s = String(whenVal).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = Number(mdy[1]);
    const dd = Number(mdy[2]);
    const yy = Number(mdy[3]);
    const dt = new Date(yy, mm - 1, dd);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t);
}

function normalizePriority(p) {
  const s = String(p || "").trim().toLowerCase();
  if (!s) return "normal";
  if (s.includes("crit")) return "critical";
  if (s.includes("high")) return "high";
  if (s.includes("low")) return "low";
  return "normal";
}

function priorityBadgeClass(priority) {
  const p = normalizePriority(priority);
  if (p === "critical") return "badge rounded-pill bg-dark";
  if (p === "high") return "badge rounded-pill bg-success";
  if (p === "normal") return "badge rounded-pill bg-warning text-dark";
  if (p === "low") return "badge rounded-pill bg-secondary";
  return "badge rounded-pill bg-warning text-dark";
}

function statusBadgeClass(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s.includes("pend")) return "badge rounded-pill bg-secondary";
  if (s.includes("in progress") || s.includes("progress")) return "badge rounded-pill bg-info text-dark";
  if (s.includes("done") || s.includes("complete")) return "badge rounded-pill bg-success";
  if (s.includes("cancel")) return "badge rounded-pill bg-secondary";
  return "badge rounded-pill bg-light text-dark border";
}

function buildIcsEvent({ title, description, startDate, startTime, leadDays }) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = startDate.getFullYear();
  const m = pad(startDate.getMonth() + 1);
  const d = pad(startDate.getDate());

  let hh = "09";
  let mm = "00";
  const t = String(startTime || "").trim();
  const tm = t.match(/^(\d{1,2}):(\d{2})/);
  if (tm) {
    hh = pad(Math.min(23, Math.max(0, Number(tm[1]))));
    mm = pad(Math.min(59, Math.max(0, Number(tm[2]))));
  }

  const dtStart = `${y}${m}${d}T${hh}${mm}00`;
  const dtEnd = `${y}${m}${d}T${hh}${mm}00`;

  const uid = `alert-${Math.random().toString(16).slice(2)}@alert-events-app`;
  const stamp = `${y}${m}${d}T000000`;

  const safe = (x) =>
    String(x || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const lead = Math.max(0, Number(leadDays || 1));
  const trigger = `-P${lead}D`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alert Events App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safe(title)}`,
    `DESCRIPTION:${safe(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `TRIGGER:${trigger}`,
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * IMPORTANT FIX:
 * Using Content-Type: application/json triggers a CORS preflight (OPTIONS).
 * Apps Script Web App won't handle OPTIONS -> browser shows "Failed to fetch".
 * So we send text/plain (simple request) to avoid preflight.
 */
async function apiCall(webAppUrl, teamKey, action, payload) {
  const res = await fetch(webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ teamKey: teamKey || "", action, payload: payload || {} }),
  });

  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: false, error: txt || "Bad response" };
  }
}

export default function App() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const apiUrl = settings.webAppUrl; // ✅ fixes "apiUrl is not defined"

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      const data = await apiCall(settings.webAppUrl, settings.teamKey, "list", {});
      if (!data || !data.ok) throw new Error((data && data.error) || "Failed to sync");

      const mapped = (data.items || []).map((r) => ({
        id: r.id,
        when: r.when || r.date || "",
        time: r.time || "",
        title: r.title || "",
        owner: r.owner || "",
        category: r.category || "",
        status: r.status || "",
        priority: r.priority || "Normal",
        notes: r.notes || "",
      }));

      setItems(mapped);
      setLastSync(new Date());
    } catch (e) {
      setError(String((e && e.message) || e));
    } finally {
      setSyncing(false);
    }
  }, [settings.teamKey, settings.webAppUrl]);

  useEffect(() => {
    syncNow();
  }, [syncNow]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const mins = Math.max(1, Number(settings.syncMinutes || 10));
    timerRef.current = setInterval(() => {
      syncNow();
    }, mins * 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [settings.syncMinutes, syncNow]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const it of items) {
      const v = String(it.category || "").trim();
      if (v) set.add(v);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const statuses = useMemo(() => {
    const set = new Set();
    for (const it of items) {
      const v = String(it.status || "").trim();
      if (v) set.add(v);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const normalized = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return items
      .map((it) => {
        const when = parseWhenDate(it.when);
        const d = when ? new Date(when.getFullYear(), when.getMonth(), when.getDate()) : null;
        const daysFromToday = d ? Math.round((d.getTime() - startOfToday.getTime()) / 86400000) : null;

        return { ...it, _whenDate: when, _daysFromToday: daysFromToday };
      })
      .sort((a, b) => {
        const ta = a._whenDate ? a._whenDate.getTime() : Number.POSITIVE_INFINITY;
        const tb = b._whenDate ? b._whenDate.getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return normalized.filter((it) => {
      if (category !== "all" && String(it.category || "") !== category) return false;
      if (status !== "all" && String(it.status || "") !== status) return false;
      if (!qq) return true;

      const blob = [it.title, it.owner, it.notes, it.category, it.status, it.priority, it.when, it.time]
        .map((x) => String(x || ""))
        .join(" ")
        .toLowerCase();

      return blob.includes(qq);
    });
  }, [normalized, q, category, status]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const today = filtered.filter((x) => x._daysFromToday === 0).length;
    const tomorrow = filtered.filter((x) => x._daysFromToday === 1).length;
    const next7 = filtered.filter((x) => x._daysFromToday != null && x._daysFromToday >= 0 && x._daysFromToday <= 7).length;
    const overdue = filtered.filter((x) => x._daysFromToday != null && x._daysFromToday < 0).length;
    return { total, today, tomorrow, next7, overdue };
  }, [filtered]);

  const saveAlert = useCallback(
    async (form) => {
      setError(null);
      try {
        const payload = {
          id: form.id || "",
          when: form.when || "",
          time: form.time || "",
          title: form.title || "",
          owner: form.owner || "",
          category: form.category || "",
          status: form.status || "",
          priority: form.priority || "Normal",
          notes: form.notes || "",
        };

        const data = await apiCall(settings.webAppUrl, settings.teamKey, "upsert", payload);
        if (!data || !data.ok) throw new Error((data && data.error) || "Save failed");

        await syncNow();
        setModalOpen(false);
        setEditing(null);
      } catch (e) {
        setError(String((e && e.message) || e));
      }
    },
    [settings.teamKey, settings.webAppUrl, syncNow]
  );

  const deleteAlert = useCallback(
    async (id) => {
      if (!id) return;
      setError(null);
      try {
        const data = await apiCall(settings.webAppUrl, settings.teamKey, "delete", { id });
        if (!data || !data.ok) throw new Error((data && data.error) || "Delete failed");
        await syncNow();
      } catch (e) {
        setError(String((e && e.message) || e));
      }
    },
    [settings.teamKey, settings.webAppUrl, syncNow]
  );

  const downloadIcs = useCallback(
    (it) => {
      const d = it._whenDate || parseWhenDate(it.when);
      if (!d) return;

      const ics = buildIcsEvent({
        title: it.title || "Alert",
        description: `${it.notes || ""}`.trim(),
        startDate: d,
        startTime: it.time,
        leadDays: settings.leadDays,
      });

      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(it.title || "alert").replace(/[^\w\- ]+/g, "").slice(0, 50) || "alert"}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    [settings.leadDays]
  );

  return (
    <div className="app-bg">
      <div className="container py-3">
        <div className="topbar card shadow-sm border-0">
          <div className="card-body d-flex align-items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="app-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="flex-grow-1">
              <div className="h5 mb-0 text-white">Alert Events</div>
              <div className="small text-white-50">Team reminders • calendar exports • mobile-first</div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark border">Last sync: {lastSync ? lastSync.toLocaleString() : "—"}</span>

              <button
                className="btn btn-light btn-sm"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                + Add event
              </button>

              <button className="btn btn-outline-light btn-sm" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="alert alert-warning mt-3 mb-0">
            <strong>API error:</strong> {error}
            <div className="small mt-1">
              If you updated Apps Script permissions/scopes, deploy a <b>New version</b> in Manage deployments.
            </div>
          </div>
        ) : null}

        <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
          <button className="btn btn-primary btn-sm" disabled={syncing} onClick={syncNow}>
            {syncing ? "Syncing..." : "Sync now"}
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={() => setSettingsOpen(true)}>
            Edit API URL
          </button>
          <div className="ms-auto small text-white-50">
            API: <span className="text-white">{apiUrl}</span>
          </div>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-12 col-lg-4">
            <WeatherCard lat={settings.weatherLat} lon={settings.weatherLon} />
          </div>

          <div className="col-12 col-lg-8">
            <div className="row g-3">
              <StatCard label="Total" value={filtered.length} />
              <StatCard label="Tomorrow" value={stats.tomorrow} />
              <StatCard label="Today" value={stats.today} />
              <StatCard label="Next 7 days" value={stats.next7} />
              <StatCard label="Overdue" value={stats.overdue} />
            </div>

            <div className="card shadow-sm border-0 mt-3">
              <div className="card-body">
                <h6 className="mb-2">Calendar reminder</h6>
                <div className="text-muted small">
                  Export <strong>.ics</strong> to add a reminder to Google/Apple calendar (includes {settings.leadDays}-day-before alarm).
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-3">
          <div className="card-body">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-lg-6">
                <input className="form-control" placeholder="Search alerts..." value={q} onChange={(e) => setQ(e.target.value)} />
              </div>

              <div className="col-6 col-lg-3">
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c === "all" ? "All" : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-lg-3">
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      Status: {s === "all" ? "All" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive mt-3">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>When</th>
                    <th>Title</th>
                    <th style={{ width: 160 }}>Owner</th>
                    <th style={{ width: 140 }}>Category</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 260 }} className="text-end">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <div className="fw-semibold">{it._whenDate ? it._whenDate.toLocaleDateString() : it.when || "—"}</div>
                        <div className="text-muted small">
                          {it.time || "—"} {it._daysFromToday != null ? `• in ${it._daysFromToday} day(s)` : ""}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                          <span className={priorityBadgeClass(it.priority)}>{normalizePriority(it.priority).toUpperCase()}</span>
                          <div className="fw-semibold">{it.title || "—"}</div>
                        </div>
                        {it.notes ? <div className="text-muted small mt-1">{it.notes}</div> : null}
                      </td>

                      <td>{it.owner || "—"}</td>
                      <td>{it.category || "—"}</td>
                      <td>
                        <span className={statusBadgeClass(it.status)}>{it.status || "—"}</span>
                      </td>

                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-secondary" onClick={() => downloadIcs(it)}>
                            .ics
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setEditing({
                                id: it.id,
                                when: it._whenDate ? toLocalIsoDateInputValue(it._whenDate) : String(it.when || ""),
                                time: String(it.time || ""),
                                title: String(it.title || ""),
                                owner: String(it.owner || ""),
                                category: String(it.category || ""),
                                status: String(it.status || ""),
                                priority: String(it.priority || "Normal"),
                                notes: String(it.notes || ""),
                              });
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn btn-outline-danger" onClick={() => deleteAlert(it.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-5">
                        No events found.
                        <div className="small mt-1">
                          If this is your first run, click <b>+ Add event</b> and Save — it will write to your Google Sheet.
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="text-muted small">
              Put your logo at <code>public/logo.png</code>
            </div>
          </div>
        </div>

        {settingsOpen ? (
          <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} value={settings} onChange={setSettings} />
        ) : null}

        {modalOpen ? (
          <EventModal
            key={(editing && editing.id) || "new"}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            initial={editing}
            onSave={saveAlert}
          />
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="col-6 col-md">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="h3 mb-0">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ open, onClose, value, onChange }) {
  if (!open) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" onMouseDown={onClose}>
      <div className="modal-dialog modal-dialog-centered" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Settings</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="mb-2">
              <label className="form-label">Apps Script Web App URL</label>
              <input className="form-control" value={value.webAppUrl} onChange={(e) => onChange({ ...value, webAppUrl: e.target.value })} />
              <div className="form-text">Saved in your browser (localStorage). You set it once.</div>
            </div>

            <div className="mb-2">
              <label className="form-label">Team Key (optional)</label>
              <input className="form-control" value={value.teamKey} onChange={(e) => onChange({ ...value, teamKey: e.target.value })} placeholder="Leave blank to disable" />
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Auto-sync (minutes)</label>
                <input type="number" className="form-control" value={value.syncMinutes} onChange={(e) => onChange({ ...value, syncMinutes: Number(e.target.value || 10) })} min={1} />
              </div>

              <div className="col-6">
                <label className="form-label">Lead days (.ics alarm)</label>
                <input type="number" className="form-control" value={value.leadDays} onChange={(e) => onChange({ ...value, leadDays: Number(e.target.value || 1) })} min={0} />
              </div>
            </div>

            <hr />

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Weather Lat</label>
                <input type="number" className="form-control" value={value.weatherLat} onChange={(e) => onChange({ ...value, weatherLat: Number(e.target.value || 0) })} />
              </div>
              <div className="col-6">
                <label className="form-label">Weather Lon</label>
                <input type="number" className="form-control" value={value.weatherLon} onChange={(e) => onChange({ ...value, weatherLon: Number(e.target.value || 0) })} />
              </div>
              <div className="form-text">Weather is fetched directly from Open-Meteo in the browser (no key needed).</div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                saveSettings(value);
                onClose();
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventModal({ onClose, initial, onSave }) {
  const defaults = () => ({
    id: "",
    when: "",
    time: "09:00",
    title: "",
    owner: "",
    category: "General",
    status: "Planned",
    priority: "Normal",
    notes: "",
  });

  const [form, setForm] = useState(() => (initial ? { ...defaults(), ...initial } : defaults()));

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" onMouseDown={onClose}>
      <div className="modal-dialog modal-dialog-centered" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{form.id ? "Edit event" : "Add event"}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} />
              </div>

              <div className="col-6">
                <label className="form-label">Time</label>
                <input type="time" className="form-control" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>

              <div className="col-12">
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="col-6">
                <label className="form-label">Owner</label>
                <input className="form-control" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
              </div>

              <div className="col-6">
                <label className="form-label">Category</label>
                <input className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>

              <div className="col-6">
                <label className="form-label">Status</label>
                <input className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
              </div>

              <div className="col-6">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Normal</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea rows={3} className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!form.when || !form.title) return;
                onSave(form);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
