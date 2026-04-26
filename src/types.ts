export interface DriftPoint {
  particle_id: number;
  lat: number;
  lon: number;
  status: string;
  mass_oil: number;
}

export interface DriftFrame {
  time: string;
  points: DriftPoint[];
}

export interface DriftData {
  job_id: string;
  model: string;
  seed_lon: number;
  seed_lat: number;
  seed_frame_index: number;
  frames: DriftFrame[];
}

export interface ShipTrackData {
  timestamps: string[];
  coordinates: number[][];
  speeds: number[];
  courses: number[];
  collisions: boolean[];
}

export interface CurrentShip {
  longitude: number;
  latitude: number;
  course: number;
  hasCollision: boolean;
}
