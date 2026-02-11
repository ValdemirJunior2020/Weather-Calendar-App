// src/components/SettingsModal.jsx
// Add two fields: Apps Script URL + Team Key
import React, { useState } from "react";

export default function SettingsModal({ show, onClose, settings, setSettings, onTestNotification, onForceSync }) {
  const [local, setLocal] = useState(settings);

  if (!show) return null;

  function save() {
    setSettings(local);
    onClose();
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.55)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div className="modal-content" style={{ borderRadius: 18, overflow: "hidden" }}>
          <div className="modal-header">
            <h5 className="modal-title">Settings</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Sheet ID</label>
                <input
                  className="form-control"
                  value={local.sheetId || ""}
                  onChange={(e) => setLocal((p) => ({ ...p, sheetId: e.target.value }))}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Sheet tab name</label>
                <input
                  className="form-control"
                  value={local.sheetName || ""}
                  onChange={(e) => setLocal((p) => ({ ...p, sheetName: e.target.value }))}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Custom CSV URL (optional)</label>
                <input
                  className="form-control"
                  value={local.customCsvUrl || ""}
                  onChange={(e) => setLocal((p) => ({ ...p, customCsvUrl: e.target.value }))}
                  placeholder="If your CSV URL is different, paste it here"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Auto-sync minutes</label>
                <input
                  type="number"
                  className="form-control"
                  value={local.syncMinutes ?? 10}
                  onChange={(e) => setLocal((p) => ({ ...p, syncMinutes: Number(e.target.value) }))}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Notify lead days</label>
                <input
                  type="number"
                  className="form-control"
                  value={local.leadDays ?? 1}
                  onChange={(e) => setLocal((p) => ({ ...p, leadDays: Number(e.target.value) }))}
                />
              </div>

              <hr className="mt-4" />

              <div className="col-12">
                <div className="fw-semibold">Team editing (Google Apps Script)</div>
                <div className="text-secondary" style={{ fontSize: 13 }}>
                  Paste the Web App URL you deploy from Google Apps Script. This enables Add/Edit/Delete for everyone.
                </div>
              </div>

              <div className="col-12">
                <label className="form-label">Apps Script Web App URL</label>
                <input
                  className="form-control"
                  value={local.scriptUrl || ""}
                  onChange={(e) => setLocal((p) => ({ ...p, scriptUrl: e.target.value }))}
                  placeholder="https://script.google.com/macros/s/XXXX/exec"
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Team Key (optional)</label>
                <input
                  className="form-control"
                  value={local.teamKey || ""}
                  onChange={(e) => setLocal((p) => ({ ...p, teamKey: e.target.value }))}
                  placeholder="Leave blank if you want it fully open"
                />
              </div>

              <div className="col-12 d-flex gap-2 flex-wrap">
                <button className="btn btn-outline-secondary" type="button" onClick={onForceSync}>
                  Sync now
                </button>
                <button className="btn btn-outline-secondary" type="button" onClick={onTestNotification}>
                  Test notification
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
