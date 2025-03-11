
import React, { useEffect, useRef, useState } from 'react';
import { useTravelContext } from '../context/TravelContext';
import { PlaybackStatus, Location } from '../types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Plane, Play, Pause, SkipForward, SkipBack, Video } from 'lucide-react';
import LocationGallery from './LocationGallery';
import { toast } from '@/components/ui/use-toast';
import AnimatedPlane from './AnimatedPlane';

// Add mapboxgl type definition
declare global {
  interface Window {
    mapboxgl: typeof mapboxgl;
  }
}

const TravelGlobe: React.FC = () => {
  const {
    currentJourney,
    playbackStatus,
    currentLocationIndex,
    mapboxToken,
    nextLocation,
    previousLocation,
    setPlaybackStatus,
    generateVideo,
    isGeneratingVideo,
  } = useTravelContext();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [nextLocationTimeout, setNextLocationTimeout] = useState<number | null>(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !currentJourney) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 45,
      attributionControl: false,
    });
    
    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );
    
    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });
      
      // Add location markers
      addMarkers();
      
      // Fit bounds to include all locations
      if (currentJourney.locations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        currentJourney.locations.forEach(location => {
          bounds.extend(location.coordinates as mapboxgl.LngLatLike);
        });
        
        map.current?.fitBounds(bounds, {
          padding: 100,
          duration: 1500,
        });
      }
    });
    
    // Cleanup
    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentJourney, mapboxToken]);
  
  // Update current location when currentLocationIndex changes
  useEffect(() => {
    if (!currentJourney) return;
    
    setCurrentLocation(currentJourney.locations[currentLocationIndex]);
    
    // If we're playing, center the map on the current location
    if (playbackStatus === PlaybackStatus.PLAYING && map.current) {
      const location = currentJourney.locations[currentLocationIndex];
      
      map.current.flyTo({
        center: location.coordinates as mapboxgl.LngLatLike,
        zoom: 6,
        duration: 3000,
        essential: true,
      });
    }
  }, [currentLocationIndex, currentJourney, playbackStatus]);
  
  // Handle auto-play
  useEffect(() => {
    if (playbackStatus === PlaybackStatus.PLAYING) {
      // Schedule next location change
      const timeout = window.setTimeout(() => {
        nextLocation();
      }, 5000); // Show each location for 5 seconds
      
      setNextLocationTimeout(timeout);
    } else {
      // Clear timeout if we're not playing
      if (nextLocationTimeout) {
        clearTimeout(nextLocationTimeout);
        setNextLocationTimeout(null);
      }
    }
    
    return () => {
      if (nextLocationTimeout) {
        clearTimeout(nextLocationTimeout);
      }
    };
  }, [playbackStatus, currentLocationIndex, nextLocation]);
  
  const addMarkers = () => {
    if (!map.current || !currentJourney) return;
    
    // Clear any existing markers
    clearMarkers();
    
    // Add markers for each location
    currentJourney.locations.forEach((location, index) => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold shadow-md';
      el.textContent = `${index + 1}`;
      
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat(location.coordinates as mapboxgl.LngLatLike)
        .addTo(map.current!);
      
      markers.current.push(marker);
    });
  };
  
  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };
  
  const handlePlayPause = () => {
    if (playbackStatus === PlaybackStatus.PLAYING) {
      setPlaybackStatus(PlaybackStatus.PAUSED);
    } else {
      setPlaybackStatus(PlaybackStatus.PLAYING);
    }
  };
  
  const handleCreateVideo = async () => {
    try {
      await generateVideo();
    } catch (error) {
      console.error('Failed to generate video:', error);
      toast({
        title: 'Failed to generate video',
        description: 'Could not create video from your journey.',
        variant: 'destructive',
      });
    }
  };
  
  if (!currentJourney || !currentLocation) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <p className="text-muted-foreground">No journey data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative h-[500px] rounded-xl overflow-hidden border border-border shadow-sm">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Route Visualization */}
        {currentJourney.routes.map((route, index) => (
          <AnimatedPlane 
            key={`route-${index}`}
            startCoordinates={route.startLocation.coordinates}
            endCoordinates={route.endLocation.coordinates}
            isActive={index === currentLocationIndex - 1 && playbackStatus === PlaybackStatus.PLAYING}
            mapInstance={map.current}
          />
        ))}
        
        {/* Location Gallery Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
          <LocationGallery 
            location={currentLocation} 
            isActive={playbackStatus === PlaybackStatus.PLAYING}
          />
        </div>
      </div>
      
      {/* Video controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={previousLocation}
            disabled={currentLocationIndex === 0 || playbackStatus === PlaybackStatus.PLAYING}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePlayPause}
          >
            {playbackStatus === PlaybackStatus.PLAYING ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={nextLocation}
            disabled={
              currentLocationIndex === currentJourney.locations.length - 1 || 
              playbackStatus === PlaybackStatus.PLAYING
            }
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium">
            {currentLocationIndex + 1} / {currentJourney.locations.length}
          </span>
        </div>
        
        <Button 
          variant="default" 
          onClick={handleCreateVideo}
          disabled={isGeneratingVideo}
        >
          {isGeneratingVideo ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Generating...
            </div>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Create Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TravelGlobe;
