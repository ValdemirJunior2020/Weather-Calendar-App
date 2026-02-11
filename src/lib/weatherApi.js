// FILE: src/lib/weatherApi.js
export async function fetchWeather(scriptUrl, teamKey, lat, lon) {
  const res = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify({
      action: "weather",
      teamKey: teamKey || "",
      payload: { lat, lon },
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Weather failed");
  return data.result;
}
