// Mock route generation for the Waze-for-Sea planner.
// Mirrors the backend interpolation so the UI can preview a route immediately.

export type LonLat = [number, number];

export interface Port {
  id: string;
  name: string;
  lon: number;
  lat: number;
}

// Coordinates nudged a few km offshore from each city centre — keeps the
// start/end pins visually in the water and prevents NE 50m land polygons
// from flagging the very first sample of the route as land.
export const FALLBACK_PORTS: Port[] = [
  { id: "new_orleans", name: "New Orleans, USA", lon: -89.95, lat: 29.30 },
  { id: "houston", name: "Houston, USA", lon: -94.50, lat: 28.90 },
  { id: "tampa", name: "Tampa, USA", lon: -82.75, lat: 27.70 },
  { id: "miami", name: "Miami, USA", lon: -80.10, lat: 25.77 },
  { id: "sevastopol", name: "Sevastopol, Crimea", lon: 33.45, lat: 44.52 },
  { id: "yalta", name: "Yalta, Crimea", lon: 34.16, lat: 44.45 },
  { id: "kerch", name: "Kerch, Crimea", lon: 36.55, lat: 45.28 },
  { id: "anapa", name: "Anapa, Russia", lon: 37.25, lat: 44.83 },
  { id: "novorossiysk", name: "Novorossiysk, Russia", lon: 37.80, lat: 44.65 },
  { id: "tuapse", name: "Tuapse, Russia", lon: 39.00, lat: 44.08 },
  { id: "sochi", name: "Sochi, Russia", lon: 39.72, lat: 43.58 },
  { id: "istanbul", name: "Istanbul, Türkiye", lon: 28.97, lat: 41.01 },
];

export function interpolateRoute(
  start: LonLat,
  end: LonLat,
  segments = 64
): LonLat[] {
  const n = Math.max(2, segments);
  const coords: LonLat[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    coords.push([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]);
  }
  return coords;
}

export function routeBounds(coords: LonLat[] | number[][]): {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
} | null {
  if (!coords || coords.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}

export function parseLonLat(input: string): LonLat | null {
  const parts = input
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length !== 2) return null;
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;
  return [lon, lat];
}

export function routeAsLineFeature(coords: LonLat[] | number[][]) {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: coords },
      },
    ],
  };
}
