import { useState, useMemo, useEffect } from "react";
import SimulationForm from "../components/SimulationForm/SimulationForm";
import SimulationControls from "../components/SimulationControls/SimulationControls";
import SpillMap from "../components/SpillMap/SpillMap";
import type { DriftData, ShipTrackData } from "../types";
import {
  API_BASE_URL,
  emptyGeoJSON,
  getClosestIndex,
  parseNaiveTime,
} from "../utils";

const isFrameOnDate = (frameIso: string, targetDate: string) =>
  frameIso.startsWith(targetDate);

export default function CheckShipPage() {
  const [timeIndex, setTimeIndex] = useState(0);
  const [draftDate, setDraftDate] = useState("");
  const [draftShipId, setDraftShipId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [driftData, setDriftData] = useState<DriftData | null>(null);
  const [shipTrackData, setShipTrackData] = useState<ShipTrackData | null>(null);

  const frames = driftData?.frames || [];

  const shipEpochs = useMemo(
    () =>
      shipTrackData
        ? shipTrackData.timestamps.map((t) => parseNaiveTime(t).getTime())
        : [],
    [shipTrackData]
  );

  const loadDataFromApi = async (targetDate: string, targetShipId: string) => {
    setIsLoading(true);
    try {
      const [spillsRes, shipRes] = await Promise.all([
        fetch(`${API_BASE_URL}/spills/${targetDate}`),
        fetch(`${API_BASE_URL}/ships/${targetShipId}/${targetDate}`),
      ]);

      if (!spillsRes.ok) throw new Error("Failed to fetch spills data.");
      if (!shipRes.ok) throw new Error("Failed to fetch ship data.");

      const spillsData = await spillsRes.json();
      const shipData = await shipRes.json();

      if (spillsData && spillsData.length > 0) {
        const drift = spillsData[0];
        const framesForDate = drift.frames.filter((f: { time: string }) =>
          isFrameOnDate(f.time, targetDate)
        );
        setDriftData({ ...drift, frames: framesForDate });
      } else {
        alert("No spills found for this date.");
        setDriftData(null);
      }

      setShipTrackData(shipData);
      setTimeIndex(0);
      setIsPlaying(false);
      setIsSimulating(true);
    } catch (error) {
      console.error(error);
      alert("Error loading data from API. Ensure FastAPI is running.");
      setIsSimulating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSimulation = () => {
    if (!draftDate || !draftShipId) return;
    loadDataFromApi(draftDate, draftShipId);
  };

  const handleDateShift = (daysToAdd: number) => {
    const current = new Date(`${draftDate}T12:00:00Z`);
    current.setUTCDate(current.getUTCDate() + daysToAdd);
    const newDateStr = current.toISOString().split("T")[0];

    setDraftDate(newDateStr);
    if (isSimulating) {
      loadDataFromApi(newDateStr, draftShipId);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && isSimulating) {
      interval = setInterval(() => {
        setTimeIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    }

    return () => clearInterval(interval);
  }, [isPlaying, isSimulating, frames.length]);

  const currentTracersGeoJSON = useMemo(() => {
    if (!driftData || frames.length === 0) return emptyGeoJSON;
    const currentFrame = frames[timeIndex];
    return {
      type: "FeatureCollection",
      features: currentFrame.points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: { mass_oil: p.mass_oil, status: p.status },
      })),
    };
  }, [timeIndex, frames, driftData]);

  const { shipTrailGeoJSON, currentShip } = useMemo(() => {
    if (!shipTrackData || frames.length === 0)
      return { shipTrailGeoJSON: emptyGeoJSON, currentShip: null };

    const currentSimTime = frames[timeIndex].time;
    const closestIdx = getClosestIndex(
      parseNaiveTime(currentSimTime).getTime(),
      shipEpochs
    );

    const currentCoord = shipTrackData.coordinates[closestIdx];
    const currentCourse = shipTrackData.courses[closestIdx];
    const currentCollision = shipTrackData.collisions[closestIdx];

    const segmentFeatures = [];
    for (let i = 0; i < closestIdx; i++) {
      segmentFeatures.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            shipTrackData.coordinates[i],
            shipTrackData.coordinates[i + 1],
          ],
        },
        properties: {
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
        features: segmentFeatures,
      },
    };
  }, [timeIndex, frames, shipTrackData, shipEpochs]);

  return (
    <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
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
          width: "350px",
          minHeight: "140px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {!isSimulating ? (
          <SimulationForm
            shipId={draftShipId}
            date={draftDate}
            isLoading={isLoading}
            onShipIdChange={setDraftShipId}
            onDateChange={setDraftDate}
            onSubmit={handleStartSimulation}
          />
        ) : (
          <SimulationControls
            date={draftDate}
            shipId={draftShipId}
            currentTimeIso={frames[timeIndex].time}
            timeIndex={timeIndex}
            framesLength={frames.length}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onTimeIndexChange={(idx) => {
              setIsPlaying(false);
              setTimeIndex(idx);
            }}
            onDateShift={handleDateShift}
            onReset={() => {
              setIsSimulating(false);
              setIsPlaying(false);
            }}
          />
        )}
      </div>

      <SpillMap
        routeCoordinates={isSimulating ? shipTrackData?.coordinates ?? null : null}
        tracersGeoJSON={isSimulating ? currentTracersGeoJSON : null}
        shipTrailGeoJSON={isSimulating ? shipTrailGeoJSON : null}
        currentShip={isSimulating ? currentShip : null}
      />
    </div>
  );
}
