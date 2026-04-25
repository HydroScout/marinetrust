// src/App.tsx
import { useState, useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
// 1. Import both JSON datasets directly
import rawDriftData from './data.json';
import shipTrackData from './ship_track.json';

// --- TYPES ---
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

const driftData = rawDriftData as DriftData;

// --- PRE-COMPUTATION ---
const shipEpochs = shipTrackData.timestamps.map(t => new Date(t).getTime());

// NEW: Pre-compute the OpenDrift timestamps for instant searching
const frameEpochs = driftData.frames.map(f => new Date(f.time).getTime());

// Helper function to find the closest ship coordinate index for a given target time
const getClosestShipIndex = (targetIsoTime: string) => {
  const targetTime = new Date(targetIsoTime).getTime();
  let closestIdx = 0;
  let minDiff = Infinity;

  // The ship tracking array is already sorted chronologically by our Python script!
  for (let i = 0; i < shipEpochs.length; i++) {
    const diff = Math.abs(shipEpochs[i] - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    } else if (diff > minDiff) {
      // Because the array is sorted, if the difference starts growing, 
      // we have passed the closest point and can break the loop early to save CPU.
      break;
    }
  }
  return closestIdx;
};

// NEW: Helper to find the closest OpenDrift frame for a chosen Date
const getClosestFrameIndex = (targetTimeMs: number) => {
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < frameEpochs.length; i++) {
    const diff = Math.abs(frameEpochs[i] - targetTimeMs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx;
};

// --- AN EMPTY GEOJSON SHELL ---
// We feed this to the map before a date is picked so it renders nothing.
const emptyGeoJSON = { type: 'FeatureCollection', features: [] };

export default function App() {
  const [timeIndex, setTimeIndex] = useState(0);

  // NEW: Form draft states
  const [draftDate, setDraftDate] = useState('');
  const [draftShipId, setDraftShipId] = useState('');
  
  // NEW: The master switch that turns on the map layers
  const [isSimulating, setIsSimulating] = useState(false);

  const frames = driftData.frames;

  // The function triggered when the user clicks "Check"
  const handleStartSimulation = () => {
    if (!draftDate || !draftShipId) return;

    // TODO: In the next iteration, this is where you will:
    // const newDriftData = await fetch(`/api/spill?date=${draftDate}`);
    // const newShipData = await fetch(`/api/ship/${draftShipId}?date=${draftDate}`);

    // 1. Calculate the starting time index based on the chosen date
    const targetEpoch = new Date(`${draftDate}T00:00:00Z`).getTime();
    const startIndex = getClosestFrameIndex(targetEpoch);
    
    // 2. Set the slider to the correct time and flip the switch!
    setTimeIndex(startIndex);
    setIsSimulating(true);
  };

  // --- 1. THE OIL SPILL ---
  const currentTracersGeoJSON = useMemo(() => {
    const currentFrame = frames[timeIndex];
    return {
      type: 'FeatureCollection',
      features: currentFrame.points.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: { mass_oil: p.mass_oil, status: p.status }
      }))
    };
  }, [timeIndex, frames]);

// --- 2. THE REAL SHIP (Synced to the Oil Spill Time) ---
  const { shipTrailGeoJSON, currentShip } = useMemo(() => {
    const currentSimTime = frames[timeIndex].time;
    const closestIdx = getClosestShipIndex(currentSimTime);

    const currentCoord = shipTrackData.coordinates[closestIdx];
    const currentCourse = shipTrackData.courses[closestIdx]; 
    const currentCollision = shipTrackData.collisions[closestIdx]; 

    // NEW: Build the trail as individual color-coded segments!
    const segmentFeatures = [];
    for (let i = 0; i < closestIdx; i++) {
      segmentFeatures.push({
        type: 'Feature',
        geometry: { 
          type: 'LineString', 
          // Draw a tiny line from point A to point B
          coordinates: [shipTrackData.coordinates[i], shipTrackData.coordinates[i + 1]] 
        },
        properties: { 
          // If the ship hit oil at point B, this segment paints red
          hasCollision: shipTrackData.collisions[i + 1] 
        }
      });
    }

    return {
      currentShip: {
        longitude: currentCoord[0],
        latitude: currentCoord[1],
        course: currentCourse,
        hasCollision: currentCollision
      },
      shipTrailGeoJSON: {
        type: 'FeatureCollection',
        features: segmentFeatures // Pass our array of sliced segments
      }
    };
  }, [timeIndex, frames]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], { 
      timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      
{/* THE FLOATING UI PANEL */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, background: 'white', padding: '20px 24px', borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        width: '350px',
        minHeight: '140px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
      }}>
        
        {!isSimulating ? (
          /* --- STATE 1: THE API FORM --- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0', fontSize: '1.1rem', color: '#111827' }}>Configure Simulation</h3>
            
            <input 
              type="text" 
              placeholder="Enter Ship ID (e.g., IMO 9123456)"
              value={draftShipId}
              onChange={(e) => setDraftShipId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
            />

            <input 
              type="date" 
              min="2026-04-23" 
              max="2026-04-25"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
            />

            <button 
              onClick={handleStartSimulation}
              disabled={!draftDate || !draftShipId}
              style={{ 
                padding: '10px', borderRadius: '6px', border: 'none', 
                background: (!draftDate || !draftShipId) ? '#e5e7eb' : '#2563eb', 
                color: (!draftDate || !draftShipId) ? '#9ca3af' : 'white',
                fontWeight: 'bold', cursor: (!draftDate || !draftShipId) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Load Data
            </button>
          </div>
        ) : (
          /* --- STATE 2: THE SLIDER --- */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <h3 style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                <span style={{ color: '#3b82f6' }}>{formatTime(frames[timeIndex].time)}</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'bold' }}>
                ID: {draftShipId}
              </span>
            </div>
            
            <input 
              type="range" min={0} max={frames.length - 1} 
              value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', marginBottom: '12px' }}
            />
            
            <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => setIsSimulating(false)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
      
      <Map
        initialViewState={{ 
          longitude: driftData.seed_lon, 
          latitude: driftData.seed_lat, 
          zoom: 9 // Zoomed out slightly to ensure we see the ship approach!
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        
        {/* --- 1. DYNAMIC OIL SPILL LAYER --- */}
        <Source id="tracers-source" type="geojson" data={isSimulating ? currentTracersGeoJSON : emptyGeoJSON as any}>
          <Layer 
            id="tracers-layer" 
            type="circle" 
            paint={{
              'circle-radius': 5,
              'circle-color': [
                'match', ['get', 'status'],
                'stranded', '#ef4444', 
                '#1f2937' 
              ],
              'circle-opacity': [
                'interpolate', ['linear'], ['get', 'mass_oil'],
                0, 0.2, 1, 0.8    
              ],
              'circle-blur': 0.6 
            }} 
          />
        </Source>

        {/* --- 2. SHIP TRAIL LAYER --- */}
        <Source id="ship-trail-source" type="geojson" data={isSimulating ? shipTrailGeoJSON : emptyGeoJSON as any}>
          <Layer 
            id="ship-trail-layer" 
            type="line" 
            paint={{
              // NEW: Data-driven styling for the track history!
              'line-color': [
                'case',
                ['get', 'hasCollision'], 
                '#ef4444', // Red if it drove through oil
                '#9ca3af'  // Standard grey if the water was clear
              ],
              'line-width': 2,
              'line-dasharray': [3, 2],
              'line-opacity': 0.8
            }} 
          />
        </Source>

        {/* --- 3. DYNAMIC SHIP MARKER WITH ROTATION --- */}
        {isSimulating && (
        <Marker 
          longitude={currentShip.longitude} 
          latitude={currentShip.latitude} 
          anchor="center"
        >
          <div style={{ 
            transform: `rotate(${currentShip.course}deg)`,
            transition: 'transform 0.2s ease-out, fill 0.3s ease' // Added fill transition
          }}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              // NEW: Data-driven styling! Red if collision, Dark Grey if safe.
              fill={currentShip.hasCollision ? "#ef4444" : "#111827"} 
              style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}
            >
              <path d="M12 2 L4 20 L12 17 L20 20 Z" />
            </svg>
          </div>
        </Marker>
        )}

      </Map>
    </main>
  );
}