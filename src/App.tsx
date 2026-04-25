// src/App.tsx
import { useState, useMemo } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mockSectorData, mockRouteData, getRouteCoordinates, getRouteTimestamps, getDriftingSpill } from './mocks';

export default function App() {
  // --- STATE ---
  // Tracks the index of the slider (0 to length of route - 1)
  const [timeIndex, setTimeIndex] = useState(0);

  // --- DERIVED DATA ---
  const routeCoords = getRouteCoordinates();
  const routeTimes = getRouteTimestamps();
  
  // Create a dynamic GeoJSON point for the CURRENT position based on the slider
  const currentPointGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: routeCoords[timeIndex] // The magic happens here!
          },
          properties: {}
        }
      ]
    };
  }, [timeIndex, routeCoords]);

  // 2. NEW: The drifting and dissipating oil spill
  const currentSpillGeoJSON = useMemo(() => {
    return getDriftingSpill(timeIndex);
  }, [timeIndex]);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
      {/* --- THE FLOATING UI PANEL --- */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10, // Ensures it sits above the map
        background: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        minWidth: '300px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>
          Time: <span style={{ color: '#3b82f6' }}>{routeTimes[timeIndex]}</span>
        </h3>
        
        <input 
          type="range" 
          min={0} 
          max={routeCoords.length - 1} 
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* --- THE MAP --- */}
      <Map
        initialViewState={{
          longitude: 27.93,
          latitude: 43.22,
          zoom: 12
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* --- DYNAMIC SPILL LAYER --- */}
        {/* Note: We use our data-driven styling again. Because the probability 
            drops over time in our mock, the color will fade from dark red to light pink! */}
        <Source id="sector-source" type="geojson" data={currentSpillGeoJSON as any}>
          <Layer 
            id="sector-layer" 
            type="fill" 
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'probability'],
                0, '#fee5d9',   
                0.5, '#fb6a4a', 
                1, '#cb181d'    
              ],
              'fill-opacity': 0.5
            }} 
          />
        </Source>
        {/* 1. Sector Layer (from earlier) */}
        <Source id="sector-source" type="geojson" data={mockSectorData}>
          <Layer id="sector-layer" type="fill" paint={{ 'fill-color': '#fb6a4a', 'fill-opacity': 0.4 }} />
        </Source>

        {/* 2. Full Route Line (from earlier) */}
        <Source id="route-source" type="geojson" data={mockRouteData}>
          <Layer id="route-layer" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 4, 'line-dasharray': [2, 1] }} />
        </Source>

        {/* 3. NEW: The Moving Dot based on timeIndex */}
        <Source id="current-point-source" type="geojson" data={currentPointGeoJSON as any}>
          {/* A glowing halo effect */}
          <Layer 
            id="point-halo" 
            type="circle" 
            paint={{ 'circle-radius': 12, 'circle-color': '#2563eb', 'circle-opacity': 0.3 }} 
          />
          {/* The solid center dot */}
          <Layer 
            id="point-core" 
            type="circle" 
            paint={{ 'circle-radius': 6, 'circle-color': '#1d4ed8', 'circle-stroke-width': 2, 'circle-stroke-color': 'white' }} 
          />
        </Source>

      </Map>
    </main>
  );
}