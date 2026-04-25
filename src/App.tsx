// src/App.tsx
import { useState, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// 1. Import your real data directly! (Make sure data.json is in the src folder)
// 1. Import the JSON as a raw object
import rawDriftData from './data.json';

// 2. Tell TypeScript EXACTLY what this data looks like
interface DriftPoint {
  particle_id: number;
  lat: number;
  lon: number;
  status: string;
  mass_oil: number;
}

interface DriftFrame {
  time: string;
  points: DriftPoint[];
}

interface DriftData {
  job_id: string;
  model: string;
  seed_lon: number;
  seed_lat: number;
  seed_frame_index: number;
  frames: DriftFrame[];
}

// 3. Cast the raw data to our new type
const driftData = rawDriftData as DriftData;

// Keep the route data just for the ship tracker (if you still want it)
import { mockRouteData, getRouteCoordinates } from './mocks';

export default function App() {
  const [timeIndex, setTimeIndex] = useState(0);

  const routeCoords = getRouteCoordinates();
  
  // 2. Extract the real frames from your OpenDrift output
  const frames = driftData.frames;

  // 3. The moving tracker dot (Ship)
  const currentPointGeoJSON = useMemo(() => {
    const safeIndex = Math.min(timeIndex, routeCoords.length - 1);
    return {
      type: 'FeatureCollection',
      features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: routeCoords[safeIndex] },
          properties: {}
      }]
    };
  }, [timeIndex, routeCoords]);

  // 4. REAL DATA: The OpenDrift Tracers mapped to GeoJSON
  const currentTracersGeoJSON = useMemo(() => {
    const currentFrame = frames[timeIndex];
    
    return {
      type: 'FeatureCollection',
      features: currentFrame.points
        // Optional: Filter out stranded particles if you only want to see active drift
        // .filter((p: any) => p.status === 'active') 
        .map((p: any) => ({
          type: 'Feature',
          geometry: { 
            type: 'Point', 
            coordinates: [p.lon, p.lat] // MapLibre requires [Longitude, Latitude]
          },
          properties: {
            mass_oil: p.mass_oil,
            status: p.status
          }
      }))
    };
  }, [timeIndex, frames]);

  // 5. Format the timestamp nicely for the UI
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
      {/* --- THE FLOATING UI PANEL --- */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, background: 'white', padding: '16px 24px', borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', minWidth: '350px', textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>
          Time: <span style={{ color: '#3b82f6' }}>{formatTime(frames[timeIndex].time)}</span>
        </h3>
        
        <input 
          type="range" 
          min={0} 
          max={frames.length - 1} 
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
          Active Particles: {frames[timeIndex].points.length}
        </div>
      </div>
      
      <Map
        // Dynamically center the map on the OpenDrift seed coordinates!
        initialViewState={{ 
          longitude: driftData.seed_lon, 
          latitude: driftData.seed_lat, 
          zoom: 10 
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* --- DYNAMIC OPENDRIFT TRACER LAYER --- */}
        <Source id="tracers-source" type="geojson" data={currentTracersGeoJSON as any}>
          <Layer 
            id="tracers-layer" 
            type="circle" 
            paint={{
              'circle-radius': 6,
              // Data-driven styling: 'stranded' particles turn red, 'active' are dark grey
              'circle-color': [
                'match',
                ['get', 'status'],
                'stranded', '#ef4444', // Red for hit the coast
                '#1f2937' // Dark grey for active oil
              ],
              // Data-driven styling: opacity scales with the mass of the oil particle
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'mass_oil'],
                0, 0.2,   // Low mass = highly transparent
                1, 0.8    // High mass = opaque
              ],
              'circle-blur': 0.6 
            }} 
          />
        </Source>

        {/* --- Route & Tracker Layers --- */}
        <Source id="route-source" type="geojson" data={mockRouteData}>
          <Layer id="route-layer" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 4, 'line-dasharray': [2, 1] }} />
        </Source>

        <Source id="current-point-source" type="geojson" data={currentPointGeoJSON as any}>
          <Layer id="point-halo" type="circle" paint={{ 'circle-radius': 12, 'circle-color': '#2563eb', 'circle-opacity': 0.3 }} />
          <Layer id="point-core" type="circle" paint={{ 'circle-radius': 6, 'circle-color': '#1d4ed8', 'circle-stroke-width': 2, 'circle-stroke-color': 'white' }} />
        </Source>

      </Map>
    </main>
  );
}