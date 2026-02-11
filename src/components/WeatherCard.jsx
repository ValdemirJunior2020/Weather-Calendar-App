// FILE: src/components/WeatherCard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";

function codeToEmoji(code) {
  const c = Number(code);
  if (c === 0) return "☀️";
  if (c >= 1 && c <= 3) return "⛅";
  if (c >= 45 && c <= 48) return "🌫️";
  if (c >= 51 && c <= 57) return "🌦️";
  if (c >= 61 && c <= 67) return "🌧️";
  if (c >= 71 && c <= 77) return "🌨️";
  if (c >= 80 && c <= 82) return "🌦️";
  if (c >= 95 && c <= 99) return "⛈️";
  return "🌤️";
}

function safeNum(n, fallback = null) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

// IMPORTANT: Apps Script Web App + CORS
// Use text/plain to avoid OPTIONS preflight (Apps Script doesn't handle OPTIONS).
async function postToAppsScript(apiUrl, action, payload, teamKey = "") {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ teamKey: teamKey || "", action, payload: payload || {} }),
  });

  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: false, error: txt || "Bad response" };
  }
}

async function fetchWeatherDirect(lat, lon) {
  // Fahrenheit + mph (browser direct)
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    "&current=temperature_2m,weather_code,wind_speed_10m" +
    "&temperature_unit=fahrenheit" +
    "&windspeed_unit=mph" +
    "&timezone=auto";

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
  const j = await r.json();

  return {
    location: { lat, lon },
    current: j.current || null,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchPlace(lat, lon) {
  // City/State (CORS-friendly)
  const url =
    "https://api.bigdatacloud.net/data/reverse-geocode-client" +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    "&localityLanguage=en";

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Geo HTTP ${r.status}`);
  const j = await r.json();

  const city =
    j.city ||
    j.locality ||
    j.principalSubdivision ||
    j.localityInfo?.administrative?.[0]?.name ||
    "";

  const state = j.principalSubdivision || "";
  const country = j.countryName || "";

  return {
    city: String(city || "").trim(),
    state: String(state || "").trim(),
    country: String(country || "").trim(),
  };
}

export default function WeatherCard({
  apiUrl,          // Apps Script URL (your /exec)
  teamKey = "",    // optional
  lat,
  lon,
  title = "Weather",
}) {
  const latNum = useMemo(() => safeNum(lat, null), [lat]);
  const lonNum = useMemo(() => safeNum(lon, null), [lon]);

  const [loading, setLoading] = useState(false);
  const [weatherErr, setWeatherErr] = useState(null);
  const [placeErr, setPlaceErr] = useState(null);

  const [current, setCurrent] = useState(null);
  const [place, setPlace] = useState(null);

  const refresh = useCallback(async () => {
    if (latNum == null || lonNum == null) {
      setWeatherErr("Missing lat/lon");
      return;
    }

    setLoading(true);
    setWeatherErr(null);
    setPlaceErr(null);

    // 1) Place (city/state) — independent from weather
    try {
      const p = await fetchPlace(latNum, lonNum);
      setPlace(p);
    } catch (e) {
      setPlace(null);
      setPlaceErr(String((e && e.message) || e));
    }

    // 2) Weather — try direct first; if it fails, fall back to Apps Script proxy
    try {
      const direct = await fetchWeatherDirect(latNum, lonNum);
      setCurrent(direct.current);
    } catch (e1) {
      try {
        if (!apiUrl) throw new Error("No apiUrl set for Apps Script fallback");

        const data = await postToAppsScript(
          apiUrl,
          "weather",
          { lat: latNum, lon: lonNum },
          teamKey
        );

        if (!data || !data.ok) {
          throw new Error((data && data.error) || "Apps Script weather failed");
        }

        // your Code.gs returns { ok:true, result:{ ok:true, current:{...} } } OR { ok:true, result:{ current:{...} } }
        const result = data.result || {};
        const nextCurrent = (result.current && result.current) || result.current || null;

        // Some older versions returned { ok:true, current:... } directly
        setCurrent(nextCurrent || null);
      } catch (e2) {
        const msg1 = String((e1 && e1.message) || e1);
        const msg2 = String((e2 && e2.message) || e2);
        setCurrent(null);
        setWeatherErr(`Failed to fetch (direct: ${msg1}) (fallback: ${msg2})`);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, teamKey, latNum, lonNum]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const emoji = useMemo(() => codeToEmoji(current?.weather_code), [current?.weather_code]);

  const placeLabel = useMemo(() => {
    if (!place) return null;
    const city = String(place.city || "").trim();
    const state = String(place.state || "").trim();
    const country = String(place.country || "").trim();

    if (city && state) return `${city}, ${state}`;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (state && country) return `${state}, ${country}`;
    return country || null;
  }, [place]);

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <h6 className="mb-0">
            {title} <span aria-hidden="true">{emoji}</span>
          </h6>

          <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={refresh} disabled={loading}>
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        <div className="small text-muted mt-1">
          {placeLabel ? (
            <>
              {placeLabel} • {latNum.toFixed(4)}, {lonNum.toFixed(4)}
            </>
          ) : (
            <>
              {latNum.toFixed(4)}, {lonNum.toFixed(4)}
            </>
          )}
        </div>

        {placeErr ? <div className="text-muted small mt-2">Location: {placeErr}</div> : null}

        {weatherErr ? (
          <div className="alert alert-warning mt-2 mb-0">Weather error: {weatherErr}</div>
        ) : current ? (
          <div className="mt-3">
            <div className="display-6 mb-0">{Math.round(current.temperature_2m)}°F</div>
            <div className="text-muted small">
              Wind: {Math.round(current.wind_speed_10m)} mph • Code: {current.weather_code}
            </div>
          </div>
        ) : (
          <div className="text-muted mt-3">—</div>
        )}
      </div>
    </div>
  );
}
