// src/components/EditAlertModal.jsx
import React, { useEffect, useMemo, useState } from "react";

const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const STATUSES = ["Planned", "Pending", "In Progress", "Done"];
const CATEGORIES = ["Training", "Rollout", "Milestone", "Governance", "Tech", "General"];

export default function EditAlertModal({ show, onClose, initial, onSave, onDelete }) {
  const isEdit = !!(initial && initial.id);

  const [form, setForm] = useState(() => ({
    id: initial?.id || "",
    title: initial?.title || "",
    date: initial?.date || initial?.dateStr || "",
    time: initial?.time || "09:00",
    owner: initial?.owner || "",
    category: initial?.category || "General",
    status: initial?.status || "Planned",
    priority: initial?.priority || "Normal",
    notes: initial?.notes || "",
    source: initial?.source || "sheet",
  }));

  useEffect(() => {
    if (!show) return;
    setForm({
      id: initial?.id || "",
      title: initial?.title || "",
      date: initial?.date || initial?.dateStr || "",
      time: initial?.time || "09:00",
      owner: initial?.owner || "",
      category: initial?.category || "General",
      status: initial?.status || "Planned",
      priority: initial?.priority || "Normal",
      notes: initial?.notes || "",
      source: initial?.source || "sheet",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initial?.id]);

  const canSave = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.date.trim()) return false;
    return true;
  }, [form.title, form.date]);

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.55)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content" style={{ borderRadius: 18, overflow: "hidden" }}>
          <div className="modal-header">
            <h5 className="modal-title">{isEdit ? "Edit alert" : "Add team alert"}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="col-6 col-md-4">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>

              <div className="col-6 col-md-4">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Owner</label>
                <input
                  className="form-control"
                  value={form.owner}
                  onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="col-12">
                <div className="small text-secondary">
                  This will save into the Google Sheet so the whole team sees it.
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer d-flex justify-content-between">
            <div>
              {isEdit ? (
                <button type="button" className="btn btn-outline-danger" onClick={() => onDelete(form)}>
                  Delete
                </button>
              ) : null}
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={!canSave} onClick={() => onSave(form)}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
