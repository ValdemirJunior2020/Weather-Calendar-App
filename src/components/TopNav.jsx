import React from "react";

export default function TopNav({ onOpenSettings, onOpenAdd, lastSyncLabel }) {
  return (
    <div className="glass rounded-4 p-3 mb-3">
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{
              width: 42,
              height: 42,
              background: "linear-gradient(135deg, rgba(59,130,246,.95), rgba(34,197,94,.75))",
              boxShadow: "0 12px 25px rgba(0,0,0,.25)"
            }}
          >
            <span style={{ fontSize: 20 }}>⏰</span>
          </div>
          <div className="text-white">
            <div className="fw-bold" style={{ lineHeight: 1.05, fontSize: 18 }}>
              Alert Events
            </div>
            <div className="small-muted" style={{ fontSize: 12 }}>
              Team reminders • calendar exports • mobile-first
            </div>
          </div>
        </div>

        <div className="ms-auto d-flex align-items-center gap-2 flex-wrap">
          <span className="badge rounded-pill text-bg-light badge-soft">
            Last sync: {lastSyncLabel || "—"}
          </span>

          <button className="btn btn-light btn-sm" onClick={onOpenAdd}>
            + Add local alert
          </button>

          <button className="btn btn-outline-light btn-sm" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
