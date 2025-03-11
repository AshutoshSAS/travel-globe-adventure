export interface Location {
  id: string;
  name: string;
  address?: string;
  coordinates: [number, number]; // [longitude, latitude]
  photos: Photo[];
  userPhotos?: File[]; // Added for user uploaded photos
}

export interface Photo {
  id: string;
  url: string;
  alt: string;
  isUserUploaded?: boolean; // Flag to identify user uploaded photos
}

export interface RouteSegment {
  startLocation: Location;
  endLocation: Location;
  path: [number, number][]; // Array of [longitude, latitude] coordinates
}

export interface TravelJourney {
  id: string;
  name: string;
  locations: Location[];
  routes: RouteSegment[];
}

export interface MapboxGeocodeResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

export enum PlaybackStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum TravelStage {
  INPUT = 'input',
  VISUALIZATION = 'visualization',
  PREVIEW = 'preview',
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
}
