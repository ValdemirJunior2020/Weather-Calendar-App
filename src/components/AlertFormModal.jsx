import React, { useMemo, useState } from "react";
import { parseDateFlexible } from "../lib/dates.js";

const DEFAULT = {
  title: "",
  date: "",
  time: "",
  owner: "",
  status: "Planned",
  category: "General",
  priority: "Normal",
  notes: ""
};

export default function AlertFormModal({ show, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT);

  const canSave = useMemo(() => {
    const t = form.title.trim();
    const d = parseDateFlexible(form.date);
    return t.length > 0 && !!d;
  }, [form]);

  function reset() {
    setForm(DEFAULT);
  }

  function close() {
    reset();
    onClose();
  }

  function submit(e) {
    e.preventDefault();
    if (!canSave) return;

    const dateObj = parseDateFlexible(form.date);

    onSave({
      id: crypto.randomUUID(),
      source: "local",
      title: form.title.trim(),
      dateStr: form.date.trim(),
      dateObj,
      time: form.time.trim(),
      owner: form.owner.trim(),
      status: form.status,
      category: form.category.trim() || "General",
      priority: form.priority,
      notes: form.notes.trim(),
      raw: null
    });

    close();
  }

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.55)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-4 overflow-hidden">
          <div className="modal-header">
            <h5 className="modal-title">Add local alert</h5>
            <button type="button" className="btn-close" onClick={close} />
          </div>

          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-2">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Wave 1 starts"
                  required
                />
              </div>

              <div className="row g-2">
                <div className="col-7">
                  <label className="form-label">Date * (YYYY-MM-DD)</label>
                  <input
                    className="form-control"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    placeholder="2026-03-02"
                    required
                  />
                </div>
                <div className="col-5">
                  <label className="form-label">Time (optional)</label>
                  <input
                    className="form-control"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                    placeholder="9:00 AM"
                  />
                </div>
              </div>

              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Owner</label>
                  <input
                    className="form-control"
                    value={form.owner}
                    onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
                    placeholder="e.g., Jim Fryer"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Category</label>
                  <input
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g., Training"
                  />
                </div>
              </div>

              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option>Planned</option>
                    <option>In Progress</option>
                    <option>Immediate</option>
                    <option>Upcoming</option>
                    <option>Pending</option>
                    <option>Done</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div className="mt-2">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Details your team should know..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={close}>
                Cancel
              </button>
              <button type="submit" className="btn btn-dark" disabled={!canSave}>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
