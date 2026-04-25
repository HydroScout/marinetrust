// src/mocks.ts
import type { FeatureCollection, LineString } from 'geojson';

// 1. Mock Sector (Heatmap Polygon)
// Notice the 'probability' property. We will use MapLibre's data-driven styling to color this.
export const mockSectorData: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { probability: 0.85 }, // High probability
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [28.58, 43.20], // [Longitude, Latitude] around Varna
            [28.65, 43.20],
            [28.65, 43.24],
            [28.58, 43.24],
            [28.54, 43.20],
            [28.54, 43.18],
            [28.58, 43.20]  // First and last coordinates MUST match to close the polygon
          ]
        ]
      }
    }
  ]
};

// {
//   "type":"Polygon",
//   "coordinates": [
//     [
//       [-89.104958,29.235481],
//       [-89.02771,29.331604],
//       [-88.893814,29.261542],
//       [-88.834076,29.260943],
//       [-88.834076,29.205518],
//       [-88.864975,29.207915],
//       [-88.892441,29.230987],
//       [-89.004707,29.289393],
//       [-89.057922,29.229489],
//       [-89.104958,29.235481]
//     ]
//   ]
// }

// Upgraded Route with Timestamps
export const mockRouteData: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { 
        name: 'Tracked Entity Route',
        // Array of timestamps matching the coordinates
        timestamps: [
          '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM', 
          '08:00 AM', '08:15 AM', '08:30 AM', '08:45 AM', 
          '08:00 AM', '08:15 AM', '08:30 AM'
        ]
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [28.50, 43.15],
          [28.52, 43.18],
          [28.54, 43.19],
          [28.59, 43.20],
          [28.59, 43.21],
          [28.61, 43.22],
          [28.63, 43.21],
          [28.64, 43.23],
          [28.65, 43.24],
          [28.66, 43.22],
          [28.68, 43.21]
        ]
      }
    }
  ]
};

// Helper function to extract just the coordinates cleanly for TypeScript
export const getRouteCoordinates = () => {
  // Cast the generic Geometry explicitly to a LineString first
  const geometry = mockRouteData.features[0].geometry as LineString;
  return geometry.coordinates;
};
// Helper function to extract the timestamps
export const getRouteTimestamps = () => {
  return mockRouteData.features[0].properties!.timestamps as string[];
};

export const getDriftingSpill = (timeIndex: number): FeatureCollection => {
  // 1. Base Center point of the spill (Varna coast)
  let centerLng = 28.615;
  let centerLat = 43.220;

  // 2. Apply Drift (moves East and slightly North over time)
  centerLng += timeIndex * 0.004;
  centerLat += timeIndex * 0.002;

  // 3. Morphing Parameters
  // Shrink: Base radius is 0.02 degrees, shrinks by 0.002 per time step
  const radius = Math.max(0.004, 0.02 - (timeIndex * 0.001));
  
  // Squash: Y-axis scale starts at 1.0, squashes down to 0.3
  const squashFactor = Math.max(0.2, 1 - (timeIndex * 0.1));
  
  // Bend: How hard the "belly" of the shape pushes inward to make a crescent
  const bendFactor = timeIndex * 0.008; 

  // 4. Generate the 32-point polygon dynamically
  const numPoints = 32;
  const coords = [];

  for (let i = 0; i <= numPoints; i++) {
    // Calculate the angle for this vertex (0 to 2 * PI)
    const theta = (i / numPoints) * Math.PI * 2;

    // Start with a basic circle
    let x = Math.cos(theta) * radius;
    let y = Math.sin(theta) * radius;

    // Apply the squash (flatten the Y axis)
    y = y * squashFactor;

    // Apply the Half-Moon Bend
    // We use a parabolic curve (1 - sin(theta)^2) to push the middle of the shape
    // to the right without moving the top and bottom tips.
    const yNormalized = Math.sin(theta); 
    x += bendFactor * (1 - (yNormalized * yNormalized));

    // Translate to our actual map coordinates
    coords.push([centerLng + x, centerLat + y]);
  }
  // Note: Because i goes from 0 to numPoints (<=), the last point equals the first, closing the polygon perfectly!

  // 5. Dissipation (Fading color over time)
  const currentProbability = Math.max(0.1, 0.9 - (timeIndex * 0.1));

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { probability: currentProbability },
        geometry: {
          type: 'Polygon',
          coordinates: [coords] // MapLibre expects an array of rings
        }
      }
    ]
  };
};

// Simulating OpenDrift Output: Array of Timesteps -> Array of Particles -> [Lng, Lat]
export const getOpenDriftTracers = () => {
  const numTimesteps = 60; // 60 frames of data
  const numParticles = 300; // 300 tracers simulating the oil
  const center = [27.915, 43.220]; // Varna Coast
  
  const timesteps: [number, number][][] = [];
  
  // Frame 0: Initial spill (tightly clustered around the center)
  let currentParticles = Array.from({ length: numParticles }, () => [
    center[0] + (Math.random() - 0.5) * 0.004,
    center[1] + (Math.random() - 0.5) * 0.004
  ]) as [number, number][];
  
  for (let t = 0; t < numTimesteps; t++) {
     timesteps.push(currentParticles);
     
     // Calculate the next frame: Ocean current drift + diffusion (spreading)
     currentParticles = currentParticles.map(p => [
         // Drift East (0.0005) + Random diffusion
         p[0] + 0.0005 + (Math.random() - 0.5) * 0.001, 
         // Drift North (0.0002) + Random diffusion
         p[1] + 0.0002 + (Math.random() - 0.5) * 0.001  
     ]);
  }
  
  return timesteps;
};