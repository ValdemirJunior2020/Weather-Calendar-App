// src/components/AlertsTable.jsx
import React, { useMemo } from "react";
import { fmtDate, daysUntil, isPast, isToday, isTomorrow } from "../lib/dates.js";
import { downloadAlertIcs } from "../lib/ics.js";

function pillClassFor(alert) {
  // Date overrides (no red)
  if (isPast(alert.dateObj)) return "text-bg-purple"; // overdue
  if (isToday(alert.dateObj)) return "text-bg-warning"; // today
  if (isTomorrow(alert.dateObj)) return "text-bg-primary"; // tomorrow

  // Priority colors for future items
  const p = String(alert.priority || "Normal").toLowerCase().trim();
  if (p === "critical") return "text-bg-purple";
  if (p === "high") return "text-bg-success";
  if (p === "normal") return "text-bg-orange";
  if (p === "low") return "text-bg-secondary";
  return "text-bg-light";
}

export default function AlertsTable({
  alerts,
  query,
  setQuery,
  filters,
  setFilters,
  onSnooze,
  snoozedSet,
  onEdit,
}) {
  const categories = useMemo(() => {
    const s = new Set();
    for (const a of alerts) s.add(a.category || "General");
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [alerts]);

  const statuses = useMemo(() => {
    const s = new Set();
    for (const a of alerts) s.add(a.status || "Planned");
    return ["All", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [alerts]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const cat = filters?.category || "All";
    const st = filters?.status || "All";
    const showSnoozed = !!filters?.showSnoozed;

    return (alerts || []).filter((a) => {
      const hay = [a.title, a.owner, a.status, a.category, a.priority, a.notes, a.dateStr]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (cat !== "All" && (a.category || "General") !== cat) return false;
      if (st !== "All" && (a.status || "Planned") !== st) return false;

      const isSnoozed = snoozedSet?.has?.(a.id);
      if (!showSnoozed && isSnoozed) return false;

      return true;
    });
  }, [alerts, query, filters, snoozedSet]);

  return (
    <div className="card-soft rounded-4 p-3">
      <div className="sticky-tools">
        <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
          <input
            className="form-control"
            placeholder="Search alerts (title, owner, notes, date...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: 240 }}
          />

          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={filters?.category || "All"}
            onChange={(e) => setFilters((p) => ({ ...(p || {}), category: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={filters?.status || "All"}
            onChange={(e) => setFilters((p) => ({ ...(p || {}), status: e.target.value }))}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>

          <div className="form-check ms-auto">
            <input
              className="form-check-input"
              type="checkbox"
              id="showSnoozed"
              checked={!!filters?.showSnoozed}
              onChange={(e) => setFilters((p) => ({ ...(p || {}), showSnoozed: e.target.checked }))}
            />
            <label className="form-check-label" htmlFor="showSnoozed">
              Show snoozed
            </label>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: 140 }}>When</th>
              <th>Title</th>
              <th className="hide-xs" style={{ width: 160 }}>
                Owner
              </th>
              <th className="hide-xs" style={{ width: 140 }}>
                Category
              </th>
              <th style={{ width: 130 }}>Status</th>
              <th style={{ width: 320 }}></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((a) => {
              const d = daysUntil(a.dateObj);
              const dLabel =
                typeof d === "number"
                  ? d < 0
                    ? `${Math.abs(d)} day(s) ago`
                    : d === 0
                    ? "Today"
                    : d === 1
                    ? "Tomorrow"
                    : `In ${d} day(s)`
                  : "—";

              const snoozed = snoozedSet?.has?.(a.id);

              return (
                <tr key={a.id} style={{ opacity: snoozed ? 0.55 : 1 }}>
                  <td>
                    <div className="fw-semibold">{fmtDate(a.dateObj) || a.dateStr || "—"}</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      {a.time ? a.time + " • " : ""}
                      {dLabel}
                    </div>
                  </td>

                  <td>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={`badge ${pillClassFor(a)}`}>{a.priority || "Normal"}</span>
                      <span className="fw-semibold">{a.title}</span>
                      <span className="badge badge-soft rounded-pill">{a.source}</span>
                    </div>

                    {a.notes ? (
                      <div className="text-secondary mt-1" style={{ fontSize: 13 }}>
                        {a.notes}
                      </div>
                    ) : null}
                  </td>

                  <td className="hide-xs">{a.owner || "—"}</td>
                  <td className="hide-xs">{a.category || "General"}</td>

                  <td>
                    <span className="badge text-bg-light badge-soft">{a.status || "Planned"}</span>
                  </td>

                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-outline-dark btn-sm" onClick={() => downloadAlertIcs(a)}>
                        .ics
                      </button>
                      <button className="btn btn-outline-dark btn-sm" onClick={() => onSnooze(a.id, 24)}>
                        Snooze 24h
                      </button>
                      <button className="btn btn-dark btn-sm" onClick={() => onSnooze(a.id, 0)}>
                        Unsnooze
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => onEdit(a)}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filtered.length ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-secondary">
                  No alerts match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
