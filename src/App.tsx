// src/App.tsx
import { useState, useMemo, useEffect } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import NavBar from "./components/NavBar/NavBar";
// 1. Import both JSON datasets directly
import rawDriftData from "./data.json";
import shipTrackData from "./ship_track.json";

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
const shipEpochs = shipTrackData.timestamps.map((t) => new Date(t).getTime());

// NEW: Pre-compute the OpenDrift timestamps for instant searching
const frameEpochs = driftData.frames.map((f) => new Date(f.time).getTime());

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
const emptyGeoJSON = { type: "FeatureCollection", features: [] };

export default function App() {
  const [timeIndex, setTimeIndex] = useState(0);

  // NEW: Form draft states
  const [draftDate, setDraftDate] = useState("");
  const [draftShipId, setDraftShipId] = useState("");

  // NEW: The master switch that turns on the map layers
  const [isSimulating, setIsSimulating] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);

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

  // NEW: Handle jumping between dates
  const handleDateChange = (daysToAdd: number) => {
    // 1. Calculate the new date string safely
    const current = new Date(`${draftDate}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() + daysToAdd);
    const newDateStr = current.toISOString().split("T")[0];

    // 2. Update the form state
    setDraftDate(newDateStr);

    // 3. TODO: In the next iteration, trigger your API calls here!
    // const newDriftData = await fetch(`/api/spill?date=${newDateStr}`);
    // const newShipData = await fetch(`/api/ship/${draftShipId}?date=${newDateStr}`);

    // 4. Reset the UI state for the new incoming data
    setIsPlaying(false);
    setTimeIndex(0); // Resets the slider to the start of the new date
  };

  // --- THE AUTO-PLAY ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && isSimulating) {
      interval = setInterval(() => {
        setTimeIndex((prev) => {
          // If we hit the final frame, pause the playback automatically
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300); // 300ms per frame. Lower this number to make it play faster!
    }

    // Cleanup the timer when paused or unmounted
    return () => clearInterval(interval);
  }, [isPlaying, isSimulating, frames.length]);

  // --- 1. THE OIL SPILL ---
  const currentTracersGeoJSON = useMemo(() => {
    const currentFrame = frames[timeIndex];
    return {
      type: "FeatureCollection",
      features: currentFrame.points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: { mass_oil: p.mass_oil, status: p.status },
      })),
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
        type: "Feature",
        geometry: {
          type: "LineString",
          // Draw a tiny line from point A to point B
          coordinates: [
            shipTrackData.coordinates[i],
            shipTrackData.coordinates[i + 1],
          ],
        },
        properties: {
          // If the ship hit oil at point B, this segment paints red
          hasCollision: shipTrackData.collisions[i + 1],
        },
      });
    }

    return {
      currentShip: {
        longitude: currentCoord[0],
        latitude: currentCoord[1],
        course: currentCourse,
        hasCollision: currentCollision,
      },
      shipTrailGeoJSON: {
        type: "FeatureCollection",
        features: segmentFeatures, // Pass our array of sliced segments
      },
    };
  }, [timeIndex, frames]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString([], {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main style={{ width: "100vw", height: "100vh", display: "flex" }}>
      <NavBar />

      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
      {/* THE FLOATING UI PANEL */}
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
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // Slightly deeper shadow for a side-panel
          width: "350px",
          minHeight: "140px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {!isSimulating ? (
          /* --- STATE 1: THE API FORM --- */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <h3 style={{ margin: "0", fontSize: "1.1rem", color: "#111827" }}>
              Configure Simulation
            </h3>

            <input
              type="text"
              placeholder="Enter Ship ID (e.g., IMO 9123456)"
              value={draftShipId}
              onChange={(e) => setDraftShipId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
              }}
            />

            <input
              type="date"
              min="2026-04-23"
              max="2026-04-25"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
              }}
            />

            <button
              onClick={handleStartSimulation}
              disabled={!draftDate || !draftShipId}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: !draftDate || !draftShipId ? "#e5e7eb" : "#2563eb",
                color: !draftDate || !draftShipId ? "#9ca3af" : "white",
                fontWeight: "bold",
                cursor: !draftDate || !draftShipId ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              Load Data
            </button>
          </div>
        ) : (
          <>
            {/* NEW: Date Navigation Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              {/* Previous Day Button */}
              <button
                onClick={() => handleDateChange(-1)}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#4b5563",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Centered Info Block */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {draftDate} • {draftShipId}
                </div>
                <h3
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "1.1rem",
                    color: "#3b82f6",
                  }}
                >
                  {formatTime(frames[timeIndex].time)}
                </h3>
              </div>

              {/* Next Day Button */}
              <button
                onClick={() => handleDateChange(1)}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#4b5563",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* NEW: Play Button and Slider Flex Container */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  background: isPlaying ? "#ef4444" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 0.2s ease, transform 0.1s ease",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.95)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {isPlaying ? (
                  // Sleek Pause SVG
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                ) : (
                  // Sleek Play SVG (with optical centering)
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginLeft: "2px" }}
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={timeIndex}
                onChange={(e) => {
                  // If the user manually grabs the slider, instantly pause the auto-play
                  setIsPlaying(false);
                  setTimeIndex(Number(e.target.value));
                }}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "#4b5563",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => {
                  setIsSimulating(false);
                  setIsPlaying(false); // Ensure playback stops if we exit simulation mode
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
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
          zoom: 9, // Zoomed out slightly to ensure we see the ship approach!
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
      >
        {/* --- 1. DYNAMIC OIL SPILL LAYER --- */}
        <Source
          id="tracers-source"
          type="geojson"
          data={isSimulating ? currentTracersGeoJSON : (emptyGeoJSON as any)}
        >
          <Layer
            id="tracers-layer"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": [
                "match",
                ["get", "status"],
                "stranded",
                "#ef4444",
                "#1f2937",
              ],
              "circle-opacity": [
                "interpolate",
                ["linear"],
                ["get", "mass_oil"],
                0,
                0.2,
                1,
                0.8,
              ],
              "circle-blur": 0.6,
            }}
          />
        </Source>

        {/* --- 2. SHIP TRAIL LAYER --- */}
        <Source
          id="ship-trail-source"
          type="geojson"
          data={isSimulating ? shipTrailGeoJSON : (emptyGeoJSON as any)}
        >
          <Layer
            id="ship-trail-layer"
            type="line"
            paint={{
              // NEW: Data-driven styling for the track history!
              "line-color": [
                "case",
                ["get", "hasCollision"],
                "#ef4444", // Red if it drove through oil
                "#9ca3af", // Standard grey if the water was clear
              ],
              "line-width": 2,
              "line-dasharray": [3, 2],
              "line-opacity": 0.8,
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
            <div
              style={{
                transform: `rotate(${currentShip.course}deg)`,
                transition: "transform 0.2s ease-out, fill 0.3s ease", // Added fill transition
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                // NEW: Data-driven styling! Red if collision, Dark Grey if safe.
                fill={currentShip.hasCollision ? "#ef4444" : "#111827"}
                style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))" }}
              >
                <path d="M12 2 L4 20 L12 17 L20 20 Z" />
              </svg>
            </div>
          </Marker>
        )}
      </Map>
      </div>
    </main>
  );
}
