// Waze for Sea — pre-trip risk prediction tab.
// Self-contained: own map, form, warning panel. No existing components are
// modified — this file ONLY adds new behaviour.

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  FALLBACK_PORTS,
  interpolateRoute,
  parseLonLat,
  routeAsLineFeature,
  routeBounds,
  type LonLat,
  type Port,
} from "../../lib/sea/routeUtils";
import {
  RISK_COLORS,
  analyzeRoute,
  driftHazardsAt,
  fetchAlternativeRoute,
  fetchPorts,
  intersectionsAsGeoJSON,
  riskLabel,
  type SeaAnalyzeResponse,
} from "../../lib/sea/riskUtils";

const EMPTY_FC = { type: "FeatureCollection" as const, features: [] };

const DEFAULT_DEPARTURE = (() => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  // Drop seconds + offset suffix for the datetime-local input.
  return d.toISOString().slice(0, 16);
})();

export default function SeaRoutePlannerTab() {
  const mapRef = useRef<MapRef>(null);

  const [ports, setPorts] = useState<Port[]>(FALLBACK_PORTS);
  // Default to a port pair that gives a clean drift demo: Yalta is on
  // Crimea's south coast at the same latitude band the Kerch-strait spill
  // drifts into, so Yalta → Novorossiysk reliably shows the spatio-temporal
  // collision while the route itself stays entirely in open water.
  const [startId, setStartId] = useState<string>("yalta");
  const [endId, setEndId] = useState<string>("novorossiysk");
  const [customDest, setCustomDest] = useState<string>("");
  const [speedKnots, setSpeedKnots] = useState<number>(12);
  const [departureLocal, setDepartureLocal] = useState<string>(DEFAULT_DEPARTURE);

  const [route, setRoute] = useState<LonLat[] | null>(null);
  const [response, setResponse] = useState<SeaAnalyzeResponse | null>(null);
  const [altResponse, setAltResponse] = useState<SeaAnalyzeResponse | null>(null);

  const [sliderHours, setSliderHours] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load real ports from backend; fall back silently if API is down.
  useEffect(() => {
    fetchPorts()
      .then((p) => {
        if (p && p.length) setPorts(p);
      })
      .catch(() => void 0);
  }, []);

  const startPort = useMemo(() => ports.find((p) => p.id === startId), [ports, startId]);
  const endPort = useMemo(() => ports.find((p) => p.id === endId), [ports, endId]);

  const resolvedStart: LonLat | null = startPort ? [startPort.lon, startPort.lat] : null;
  const resolvedEnd: LonLat | null = (() => {
    const parsed = customDest.trim() ? parseLonLat(customDest) : null;
    if (parsed) return parsed;
    return endPort ? [endPort.lon, endPort.lat] : null;
  })();

  const handleCalculateRoute = () => {
    setError(null);
    setResponse(null);
    setAltResponse(null);
    if (!resolvedStart || !resolvedEnd) {
      setError("Pick a start and a destination.");
      return;
    }
    const r = interpolateRoute(resolvedStart, resolvedEnd, 64);
    setRoute(r);
    fitTo(r);
  };

  const handleAnalyze = async () => {
    setError(null);
    setAltResponse(null);
    if (!resolvedStart || !resolvedEnd) {
      setError("Pick a start and a destination.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const departureIso = new Date(departureLocal).toISOString();
      const data = await analyzeRoute({
        start: resolvedStart,
        end: resolvedEnd,
        speed_knots: speedKnots,
        departure_time: departureIso,
      });
      setResponse(data);
      setRoute(data.route.coordinates as LonLat[]);
      // Jump the slider to the first intersection so the user immediately
      // sees the drifted patch overlapping the vessel — the WOW moment.
      // No intersection? Park it at the end of the trip.
      const focusT = data.intersections[0]?.eta_hours ?? data.eta_total_hours;
      setSliderHours(focusT);
      fitTo(data.route.coordinates);
    } catch (e: any) {
      setError(e?.message ?? "Analysis failed. Is the API up?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestAlternative = async () => {
    if (!response || !resolvedStart || !resolvedEnd) return;
    setError(null);
    try {
      const departureIso = new Date(departureLocal).toISOString();
      // Backend curves a Catmull-Rom alternative through open water that
      // (a) starts and ends at the EXACT same coordinates, (b) avoids land,
      // (c) has no spatio-temporal collision with the drifted hazards.
      const alt = await fetchAlternativeRoute({
        start: resolvedStart,
        end: resolvedEnd,
        speed_knots: speedKnots,
        departure_time: departureIso,
      });
      setAltResponse(alt);
      fitTo([...alt.route.coordinates, ...(route ?? [])]);
    } catch (e: any) {
      setError(e?.message ?? "Alternative routing failed.");
    }
  };

  const fitTo = (coords: number[][] | LonLat[]) => {
    const b = routeBounds(coords);
    if (!b) return;
    mapRef.current?.fitBounds(
      [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ],
      { padding: 100, duration: 800 }
    );
  };

  const routeLineGeoJSON = useMemo(
    () => (route ? routeAsLineFeature(route) : EMPTY_FC),
    [route]
  );

  const altRouteGeoJSON = useMemo(
    () =>
      altResponse
        ? routeAsLineFeature(altResponse.route.coordinates)
        : EMPTY_FC,
    [altResponse]
  );

  const hazardsGeoJSON = response?.hazards ?? EMPTY_FC;

  // Predicted patch at the slider time — recomputed in JS using the same
  // drift constants the backend used. As the user drags the slider, every
  // hazard polygon shifts (wind) and grows (turbulent spreading); when the
  // slider sits at an intersection's ETA, the drifted patch lines up with
  // the vessel marker, visually proving the spatio-temporal collision.
  const predictedPatchesGeoJSON = useMemo(() => {
    if (!response) return EMPTY_FC;
    return driftHazardsAt(response.hazards, sliderHours, response.drift_params);
  }, [response, sliderHours]);

  const collisionGeoJSON = useMemo(
    () => (response ? intersectionsAsGeoJSON(response.intersections) : EMPTY_FC),
    [response]
  );

  // Vessel position at slider time.
  const vesselAtSlider = useMemo(() => {
    if (!response || !route || route.length < 2) return null;
    const totalH = response.eta_total_hours;
    if (totalH <= 0) return null;
    const t = Math.min(sliderHours, totalH);
    const targetFrac = t / totalH;
    // Walk along route by cumulative segment fraction (linear approx — same
    // as backend's linear interpolation, fine for the visual marker).
    const totalSegments = route.length - 1;
    const idx = Math.floor(targetFrac * totalSegments);
    const localFrac = targetFrac * totalSegments - idx;
    const a = route[Math.min(idx, route.length - 1)];
    const b = route[Math.min(idx + 1, route.length - 1)];
    return [a[0] + (b[0] - a[0]) * localFrac, a[1] + (b[1] - a[1]) * localFrac] as LonLat;
  }, [response, route, sliderHours]);

  const risk = response?.risk_level;
  const riskColors = risk ? RISK_COLORS[risk] : RISK_COLORS.safe;

  return (
    <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
      {/* ==================== Side panel ==================== */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          background: "white",
          padding: "20px 24px",
          borderRadius: "8px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          width: "380px",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", letterSpacing: "0.06em" }}>
            NAVIGATION
          </div>
          <h2 style={{ margin: "2px 0 0 0", fontSize: "1.25rem", color: "#111827" }}>
            Waze for Sea
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "0.85rem" }}>
            Predict hazards along your route before you leave port.
          </p>
        </div>

        <Field label="From">
          <select
            value={startId}
            onChange={(e) => setStartId(e.target.value)}
            style={selectStyle}
          >
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Where are you going?">
          <select
            value={endId}
            onChange={(e) => setEndId(e.target.value)}
            style={selectStyle}
          >
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="…or enter lon, lat (e.g. 37.0, 45.0)"
            value={customDest}
            onChange={(e) => setCustomDest(e.target.value)}
            style={{ ...inputStyle, marginTop: 6 }}
          />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label={`Speed: ${speedKnots} kn`} flex={1}>
            <input
              type="range"
              min={4}
              max={30}
              step={1}
              value={speedKnots}
              onChange={(e) => setSpeedKnots(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </Field>
          <Field label="Departure" flex={1}>
            <input
              type="datetime-local"
              value={departureLocal}
              onChange={(e) => setDepartureLocal(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCalculateRoute} style={secondaryBtnStyle}>
            Calculate Route
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{
              ...primaryBtnStyle,
              opacity: isAnalyzing ? 0.7 : 1,
              cursor: isAnalyzing ? "wait" : "pointer",
            }}
          >
            {isAnalyzing ? "Analyzing…" : "Analyze Risk"}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "#fef2f2",
              color: "#7f1d1d",
              border: "1px solid #fecaca",
              borderRadius: 6,
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {/* ==================== Risk panel ==================== */}
        {response && (
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: riskColors.bg,
              borderLeft: `4px solid ${riskColors.border}`,
              color: riskColors.fg,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <strong style={{ fontSize: "1.05rem", letterSpacing: "0.04em" }}>
                {riskLabel(response.risk_level)}
              </strong>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                ETA {response.eta_total_hours.toFixed(1)} h ·{" "}
                {response.distance_km.toFixed(0)} km
              </span>
            </div>
            <div style={{ fontSize: "0.85rem" }}>{response.recommendation}</div>

            {response.intersections.length > 0 && (
              <ul style={{ margin: "4px 0 0 0", padding: "0 0 0 16px", fontSize: "0.85rem" }}>
                {response.intersections.map((i, idx) => (
                  <li key={idx} style={{ marginBottom: 2 }}>
                    {i.hazard_type.replace(/_/g, " ")} at ETA{" "}
                    <strong>{i.eta_hours.toFixed(1)} h</strong> · confidence{" "}
                    {(i.confidence * 100).toFixed(0)}%
                  </li>
                ))}
              </ul>
            )}

            {response.risk_level !== "safe" && !altResponse && (
              <button
                onClick={handleSuggestAlternative}
                style={{
                  ...secondaryBtnStyle,
                  marginTop: 6,
                  borderColor: riskColors.border,
                  color: riskColors.fg,
                }}
              >
                Suggest alternative route
              </button>
            )}
          </div>
        )}

        {/* ==================== Alternative route panel ==================== */}
        {altResponse && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: RISK_COLORS[altResponse.risk_level].bg,
              borderLeft: `4px solid #10b981`,
              color: RISK_COLORS[altResponse.risk_level].fg,
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <strong>Alternative ({riskLabel(altResponse.risk_level)})</strong>
              <span style={{ opacity: 0.8 }}>
                ETA {altResponse.eta_total_hours.toFixed(1)} h ·{" "}
                {altResponse.distance_km.toFixed(0)} km · +
                {response
                  ? (
                      altResponse.eta_total_hours - response.eta_total_hours
                    ).toFixed(1)
                  : "—"}{" "}
                h
              </span>
            </div>
            <div style={{ opacity: 0.85 }}>{altResponse.recommendation}</div>
            <button
              onClick={() => setAltResponse(null)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: RISK_COLORS[altResponse.risk_level].fg,
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "0.75rem",
                alignSelf: "flex-start",
              }}
            >
              hide alternative
            </button>
          </div>
        )}

        {/* ==================== Time slider ==================== */}
        {response && response.eta_total_hours > 0 && (
          <Field
            label={`Trip time: ${sliderHours.toFixed(1)} h / ${response.eta_total_hours.toFixed(
              1
            )} h — drifted patch & vessel position`}
          >
            <input
              type="range"
              min={0}
              max={response.eta_total_hours}
              step={0.25}
              value={sliderHours}
              onChange={(e) => setSliderHours(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              <span>departure</span>
              {response.intersections.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSliderHours(response.intersections[0].eta_hours)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    textDecoration: "underline",
                  }}
                >
                  collision @ {response.intersections[0].eta_hours.toFixed(1)} h
                </button>
              )}
              <span>arrival</span>
            </div>
          </Field>
        )}
      </div>

      {/* ==================== Map ==================== */}
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 36, latitude: 44.7, zoom: 6 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Hazards (initial) */}
        <Source id="sea-hazards-src" type="geojson" data={hazardsGeoJSON as any}>
          <Layer
            id="sea-hazards-fill"
            type="fill"
            paint={{ "fill-color": "#ef4444", "fill-opacity": 0.35 }}
          />
          <Layer
            id="sea-hazards-line"
            type="line"
            paint={{ "line-color": "#b91c1c", "line-width": 1.5 }}
          />
        </Source>

        {/* Predicted drifted patches */}
        <Source id="sea-predicted-src" type="geojson" data={predictedPatchesGeoJSON as any}>
          <Layer
            id="sea-predicted-fill"
            type="fill"
            paint={{
              "fill-color": "#f97316",
              "fill-opacity": 0.18,
            }}
          />
          <Layer
            id="sea-predicted-line"
            type="line"
            paint={{
              "line-color": "#c2410c",
              "line-width": 1,
              "line-dasharray": [3, 2],
            }}
          />
        </Source>

        {/* Alternative route (suggestion) */}
        <Source id="sea-alt-route-src" type="geojson" data={altRouteGeoJSON as any}>
          <Layer
            id="sea-alt-route-line"
            type="line"
            paint={{
              "line-color": "#10b981",
              "line-width": 3,
              "line-dasharray": [2, 1],
            }}
          />
        </Source>

        {/* Main route */}
        <Source id="sea-route-src" type="geojson" data={routeLineGeoJSON as any}>
          <Layer
            id="sea-route-line"
            type="line"
            paint={{
              "line-color": "#2563eb",
              "line-width": 4,
              "line-opacity": 0.9,
            }}
          />
        </Source>

        {/* Collision points */}
        <Source id="sea-collision-src" type="geojson" data={collisionGeoJSON as any}>
          <Layer
            id="sea-collision-point"
            type="circle"
            paint={{
              "circle-radius": 8,
              "circle-color": "#dc2626",
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 2,
            }}
          />
        </Source>

        {resolvedStart && (
          <Marker longitude={resolvedStart[0]} latitude={resolvedStart[1]} anchor="bottom">
            <Pin color="#2563eb" label="A" />
          </Marker>
        )}
        {resolvedEnd && (
          <Marker longitude={resolvedEnd[0]} latitude={resolvedEnd[1]} anchor="bottom">
            <Pin color="#7c3aed" label="B" />
          </Marker>
        )}
        {vesselAtSlider && (
          <Marker
            longitude={vesselAtSlider[0]}
            latitude={vesselAtSlider[1]}
            anchor="center"
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#111827",
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
              title={`Vessel @ ${sliderHours.toFixed(1)} h`}
            />
          </Marker>
        )}
      </Map>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny presentational helpers (kept inline; not worth their own files).
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
  flex,
}: {
  label: string;
  children: React.ReactNode;
  flex?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, flex }}>
      <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Pin({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50% 50% 50% 0",
        transform: "rotate(-45deg)",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <span
        style={{
          transform: "rotate(45deg)",
          color: "white",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "white",
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  border: "none",
  borderRadius: 6,
  background: "#2563eb",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "white",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};
