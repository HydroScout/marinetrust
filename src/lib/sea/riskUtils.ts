// Risk-analysis API client + visual helpers for the Waze-for-Sea planner.

import { API_BASE_URL } from "../../utils";
import type { LonLat, Port } from "./routeUtils";

export type RiskLevel = "safe" | "warning" | "critical";

export interface SeaIntersection {
  hazard_type: string;
  intersection_point: [number, number];
  eta_hours: number;
  confidence: number;
  hazard_index: number;
}

export interface SeaPredictedPatch {
  hazard_index: number;
  hazard_type: string;
  t_hours: number;
  polygon: number[][][];
}

export interface DriftParams {
  wind_dx_deg_per_h: number;
  wind_dy_deg_per_h: number;
  growth_per_hour: number;
}

export interface SeaAnalyzeResponse {
  route: { type: "LineString"; coordinates: number[][] };
  risk_level: RiskLevel;
  intersections: SeaIntersection[];
  hazards: { type: "FeatureCollection"; features: any[] };
  predicted_patches: SeaPredictedPatch[];
  eta_total_hours: number;
  distance_km: number;
  departure_time: string;
  recommendation: string;
  drift_params: DriftParams;
}

export interface SeaAnalyzeRequest {
  start: LonLat;
  end: LonLat;
  speed_knots: number;
  departure_time: string; // ISO
}

export async function fetchPorts(): Promise<Port[]> {
  const res = await fetch(`${API_BASE_URL}/api/sea/ports`);
  if (!res.ok) throw new Error(`ports request failed: ${res.status}`);
  return res.json();
}

export async function fetchHazards(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/sea/hazards`);
  if (!res.ok) throw new Error(`hazards request failed: ${res.status}`);
  return res.json();
}

export async function analyzeRoute(req: SeaAnalyzeRequest): Promise<SeaAnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/sea/routes/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`analyze failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Same start/end as the analyze call but routed around land + (drifted)
// hazards. Backend builds a curved Catmull-Rom polyline and re-runs the
// collision check; first land-clear, hazard-clear candidate wins.
export async function fetchAlternativeRoute(
  req: SeaAnalyzeRequest
): Promise<SeaAnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/sea/routes/alternative`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`alternative failed: ${res.status} ${text}`);
  }
  return res.json();
}

export const RISK_COLORS: Record<RiskLevel, { bg: string; fg: string; border: string }> = {
  safe: { bg: "#ecfdf5", fg: "#065f46", border: "#10b981" },
  warning: { bg: "#fffbeb", fg: "#92400e", border: "#f59e0b" },
  critical: { bg: "#fef2f2", fg: "#7f1d1d", border: "#ef4444" },
};

export function riskLabel(r: RiskLevel): string {
  switch (r) {
    case "safe":
      return "SAFE";
    case "warning":
      return "WARNING";
    case "critical":
      return "CRITICAL";
  }
}

export function predictedPatchesAsGeoJSON(patches: SeaPredictedPatch[]) {
  return {
    type: "FeatureCollection" as const,
    features: patches.map((p) => ({
      type: "Feature" as const,
      properties: {
        hazard_index: p.hazard_index,
        hazard_type: p.hazard_type,
        t_hours: p.t_hours,
      },
      geometry: { type: "Polygon" as const, coordinates: p.polygon },
    })),
  };
}

export function intersectionsAsGeoJSON(intersections: SeaIntersection[]) {
  return {
    type: "FeatureCollection" as const,
    features: intersections.map((i) => ({
      type: "Feature" as const,
      properties: {
        hazard_type: i.hazard_type,
        eta_hours: i.eta_hours,
        confidence: i.confidence,
      },
      geometry: { type: "Point" as const, coordinates: i.intersection_point },
    })),
  };
}

// Suggest a tiny lateral offset on the destination to reroute around hazards.
// MVP: just nudge the latitude by ~0.4° (~45 km) opposite of the first hazard.
export function suggestAlternativeRoute(
  start: LonLat,
  end: LonLat,
  resp: SeaAnalyzeResponse,
  offsetDeg = 0.4
): { start: LonLat; end: LonLat } | null {
  if (!resp.intersections.length) return null;
  const hit = resp.intersections[0].intersection_point;
  const sign = end[1] >= hit[1] ? 1 : -1;
  return {
    start,
    end: [end[0], end[1] + sign * offsetDeg] as LonLat,
  };
}

// ---------------------------------------------------------------------------
// Client-side drift — mirrors the backend's predict_patch():
//   1. translate by (wind_dx * t, wind_dy * t)
//   2. scale around centroid by (1 + growth * t)
// We do this in JS so the time slider can animate the patch smoothly without
// hitting the API on every tick.
// ---------------------------------------------------------------------------

function meanCentroid(ring: number[][]): [number, number] {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  const n = ring.length || 1;
  return [cx / n, cy / n];
}

export function driftPolygonRing(
  ring: number[][],
  tHours: number,
  p: DriftParams
): number[][] {
  if (tHours <= 0) return ring.map(([x, y]) => [x, y]);
  const dx = p.wind_dx_deg_per_h * tHours;
  const dy = p.wind_dy_deg_per_h * tHours;
  const factor = 1 + p.growth_per_hour * tHours;
  const [cx, cy] = meanCentroid(ring);
  // After translation by (dx, dy) the centroid moves to (cx+dx, cy+dy).
  // Scaling around that centroid simplifies to: ncx + (x - cx) * factor.
  const ncx = cx + dx;
  const ncy = cy + dy;
  return ring.map(([x, y]) => [ncx + (x - cx) * factor, ncy + (y - cy) * factor]);
}

// Drift the original hazards FeatureCollection to time t.
export function driftHazardsAt(
  hazards: { type: "FeatureCollection"; features: any[] } | null | undefined,
  tHours: number,
  p: DriftParams
) {
  if (!hazards || !hazards.features) {
    return { type: "FeatureCollection" as const, features: [] };
  }
  return {
    type: "FeatureCollection" as const,
    features: hazards.features.map((f: any) => ({
      ...f,
      properties: { ...(f.properties ?? {}), t_hours: tHours },
      geometry: {
        type: "Polygon" as const,
        coordinates: (f.geometry?.coordinates ?? []).map((ring: number[][]) =>
          driftPolygonRing(ring, tHours, p)
        ),
      },
    })),
  };
}
