import { format } from "date-fns";
import { downloadText } from "./utils.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toIcsLocal(dateObj, timeStr) {
  let hh = 9, mm = 0;

  if (timeStr) {
    const t = String(timeStr).trim();
    const m1 = t.match(/^(\d{1,2}):(\d{2})$/);
    if (m1) { hh = Number(m1[1]); mm = Number(m1[2]); }
    const m2 = t.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
    if (m2) {
      hh = Number(m2[1]);
      mm = Number(m2[2]);
      const ap = m2[3].toLowerCase();
      if (ap === "pm" && hh < 12) hh += 12;
      if (ap === "am" && hh === 12) hh = 0;
    }
  }

  const d = new Date(dateObj);
  d.setHours(hh, mm, 0, 0);

  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());
  const H = pad2(d.getHours());
  const M = pad2(d.getMinutes());
  return `${y}${mo}${da}T${H}${M}00`;
}

export function buildIcsForAlert(alert) {
  const nowStamp = format(new Date(), "yyyyMMdd'T'HHmmss");
  const uid = `${alert.id}@alert-events-app`;
  const dtStart = alert.dateObj ? toIcsLocal(alert.dateObj, alert.time) : nowStamp;

  const title = String(alert.title ?? "Alert").replace(/\r?\n/g, " ").trim();
  const desc = String(alert.notes ?? "").replace(/\r?\n/g, "\\n").trim();
  const loc = String(alert.owner ?? "").trim();

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Alert Events App//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${nowStamp}
DTSTART:${dtStart}
SUMMARY:${title}
DESCRIPTION:${desc}
LOCATION:${loc}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${title}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

export function downloadAlertIcs(alert) {
  const safeName = String(alert.title ?? "alert")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "alert";

  downloadText(`${safeName}.ics`, buildIcsForAlert(alert), "text/calendar;charset=utf-8");
}
