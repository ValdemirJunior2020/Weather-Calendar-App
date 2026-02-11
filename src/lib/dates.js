import { parseISO, isValid, format, differenceInCalendarDays, startOfDay } from "date-fns";

export function parseDateFlexible(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;

  let d = parseISO(s);
  if (isValid(d)) return d;

  const d2 = new Date(s);
  if (isValid(d2)) return d2;

  return null;
}

export function fmtDate(d) {
  if (!d) return "";
  try {
    return format(d, "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function daysUntil(dateObj) {
  if (!dateObj) return null;
  const today = startOfDay(new Date());
  const that = startOfDay(dateObj);
  return differenceInCalendarDays(that, today);
}

export function isPast(dateObj) {
  const d = daysUntil(dateObj);
  return typeof d === "number" && d < 0;
}

export function isToday(dateObj) {
  const d = daysUntil(dateObj);
  return d === 0;
}

export function isTomorrow(dateObj) {
  const d = daysUntil(dateObj);
  return d === 1;
}
