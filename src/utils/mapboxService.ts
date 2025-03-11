
import { Location, MapboxGeocodeResult } from '../types';

export async function geocodeLocation(
  query: string, 
  accessToken: string
): Promise<MapboxGeocodeResult[]> {
  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?access_token=${accessToken}&limit=5`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.features.map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center as [number, number],
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

export async function getPlacePhotos(
  coordinates: [number, number], 
  placeName: string
): Promise<string[]> {
  // In a real implementation, you would fetch real photos from a photos API
  // For this demo, we'll use placeholder images
  
  const randomImages = [
    "https://source.unsplash.com/featured/?travel",
    "https://source.unsplash.com/featured/?landmark",
    "https://source.unsplash.com/featured/?city",
    "https://source.unsplash.com/featured/?nature"
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return randomImages.map(url => `${url}&${coordinates.join(',')}`);
}

export function formatCoordinates(coordinates: [number, number]): string {
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
}

export function estimateFlightTime(
  startCoords: [number, number], 
  endCoords: [number, number]
): number {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const [lon1, lat1] = startCoords;
  const [lon2, lat2] = endCoords;
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Assume average flight speed of 800 km/h
  const avgSpeed = 800;
  
  // Return time in hours
  return distance / avgSpeed;
}
