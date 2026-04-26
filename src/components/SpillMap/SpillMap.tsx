import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CurrentShip } from "../../types";
import { emptyGeoJSON } from "../../utils";

interface SpillMapProps {
  initialLongitude: number;
  initialLatitude: number;
  tracersGeoJSON: any;
  shipTrailGeoJSON: any;
  currentShip: CurrentShip | null;
}

export default function SpillMap({
  initialLongitude,
  initialLatitude,
  tracersGeoJSON,
  shipTrailGeoJSON,
  currentShip,
}: SpillMapProps) {
  return (
    <Map
      initialViewState={{
        longitude: initialLongitude,
        latitude: initialLatitude,
        zoom: 9,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      style={{ width: "100%", height: "100%" }}
    >
      <Source
        id="tracers-source"
        type="geojson"
        data={tracersGeoJSON ?? (emptyGeoJSON as any)}
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

      <Source
        id="ship-trail-source"
        type="geojson"
        data={shipTrailGeoJSON ?? (emptyGeoJSON as any)}
      >
        <Layer
          id="ship-trail-layer"
          type="line"
          paint={{
            "line-color": [
              "case",
              ["get", "hasCollision"],
              "#ef4444",
              "#9ca3af",
            ],
            "line-width": 2,
            "line-dasharray": [3, 2],
            "line-opacity": 0.8,
          }}
        />
      </Source>

      {currentShip && (
        <Marker
          longitude={currentShip.longitude}
          latitude={currentShip.latitude}
          anchor="center"
        >
          <div
            style={{
              transform: `rotate(${currentShip.course}deg)`,
              transition: "transform 0.2s ease-out, fill 0.3s ease",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={currentShip.hasCollision ? "#ef4444" : "#111827"}
              style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))" }}
            >
              <path d="M12 2 L4 20 L12 17 L20 20 Z" />
            </svg>
          </div>
        </Marker>
      )}
    </Map>
  );
}
