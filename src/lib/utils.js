export function safeStr(v) {
  return String(v ?? "").trim();
}

export function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(filename, obj) {
  downloadText(filename, JSON.stringify(obj, null, 2), "application/json;charset=utf-8");
}
