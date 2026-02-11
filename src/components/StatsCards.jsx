import React from "react";

export default function StatsCards({ stats }) {
  const items = [
    { label: "Total", value: stats.total ?? 0 },
    { label: "Tomorrow", value: stats.tomorrow ?? 0 },
    { label: "Today", value: stats.today ?? 0 },
    { label: "Next 7 days", value: stats.next7 ?? 0 },
    { label: "Overdue", value: stats.overdue ?? 0 }
  ];

  return (
    <div className="row g-3 mb-3">
      {items.map((it) => (
        <div className="col-6 col-lg-2" key={it.label}>
          <div className="card-soft rounded-4 p-3 h-100">
            <div className="text-secondary" style={{ fontSize: 12 }}>
              {it.label}
            </div>
            <div className="fw-bold" style={{ fontSize: 26, color: "#0f172a" }}>
              {it.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
