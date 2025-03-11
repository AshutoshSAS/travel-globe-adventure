
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Location, 
  RouteSegment, 
  TravelJourney, 
  PlaybackStatus,
  TravelStage
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../components/ui/use-toast';

interface TravelContextType {
  locations: Location[];
  currentJourney: TravelJourney | null;
  playbackStatus: PlaybackStatus;
  currentStage: TravelStage;
  currentLocationIndex: number;
  mapboxToken: string;
  isGeneratingVideo: boolean;
  
  // Methods
  addLocation: (location: Omit<Location, 'id'>) => void;
  removeLocation: (id: string) => void;
  reorderLocations: (startIndex: number, endIndex: number) => void;
  clearLocations: () => void;
  createJourney: () => Promise<void>;
  setPlaybackStatus: (status: PlaybackStatus) => void;
  nextLocation: () => void;
  previousLocation: () => void;
  setCurrentStage: (stage: TravelStage) => void;
  setMapboxToken: (token: string) => void;
  generateVideo: () => Promise<string | null>;
}

const defaultContext: TravelContextType = {
  locations: [],
  currentJourney: null,
  playbackStatus: PlaybackStatus.IDLE,
  currentStage: TravelStage.INPUT,
  currentLocationIndex: 0,
  mapboxToken: '',
  isGeneratingVideo: false,
  
  addLocation: () => {},
  removeLocation: () => {},
  reorderLocations: () => {},
  clearLocations: () => {},
  createJourney: async () => {},
  setPlaybackStatus: () => {},
  nextLocation: () => {},
  previousLocation: () => {},
  setCurrentStage: () => {},
  setMapboxToken: () => {},
  generateVideo: async () => null,
};

const TravelContext = createContext<TravelContextType>(defaultContext);

export const useTravelContext = () => useContext(TravelContext);

interface TravelProviderProps {
  children: ReactNode;
}

export const TravelProvider: React.FC<TravelProviderProps> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentJourney, setCurrentJourney] = useState<TravelJourney | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(PlaybackStatus.IDLE);
  const [currentStage, setCurrentStage] = useState<TravelStage>(TravelStage.INPUT);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const addLocation = (location: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...location,
      id: uuidv4(),
    };
    
    setLocations(prev => [...prev, newLocation]);
  };

  const removeLocation = (id: string) => {
    setLocations(prev => prev.filter(location => location.id !== id));
  };

  const reorderLocations = (startIndex: number, endIndex: number) => {
    const result = Array.from(locations);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setLocations(result);
  };

  const clearLocations = () => {
    setLocations([]);
    setCurrentJourney(null);
    setPlaybackStatus(PlaybackStatus.IDLE);
    setCurrentLocationIndex(0);
    setCurrentStage(TravelStage.INPUT);
  };

  // This would normally fetch route data from a Mapbox Directions API
  const generateRoutes = async (locationsList: Location[]): Promise<RouteSegment[]> => {
    if (locationsList.length < 2) return [];
    
    const routes: RouteSegment[] = [];
    
    // Create routes between consecutive locations
    for (let i = 0; i < locationsList.length - 1; i++) {
      const startLocation = locationsList[i];
      const endLocation = locationsList[i + 1];
      
      // This is a simplified straight line path; in a real app, you'd use Mapbox Directions API
      const path: [number, number][] = [
        startLocation.coordinates,
        endLocation.coordinates
      ];
      
      routes.push({
        startLocation,
        endLocation,
        path
      });
    }
    
    return routes;
  };

  const createJourney = async () => {
    if (locations.length < 2) {
      toast({
        title: "Not enough locations",
        description: "Please add at least two locations to create a journey.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const routes = await generateRoutes(locations);
      
      const newJourney: TravelJourney = {
        id: uuidv4(),
        name: `Journey ${new Date().toLocaleDateString()}`,
        locations,
        routes
      };
      
      setCurrentJourney(newJourney);
      setCurrentLocationIndex(0);
      setPlaybackStatus(PlaybackStatus.IDLE);
      setCurrentStage(TravelStage.VISUALIZATION);
      
      toast({
        title: "Journey created",
        description: "Your travel journey is ready to view.",
      });
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast({
        title: "Failed to create journey",
        description: "There was an error creating your journey. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextLocation = () => {
    if (!currentJourney) return;
    
    if (currentLocationIndex < currentJourney.locations.length - 1) {
      setCurrentLocationIndex(prev => prev + 1);
    } else {
      // We've reached the end
      setPlaybackStatus(PlaybackStatus.COMPLETED);
    }
  };

  const previousLocation = () => {
    if (!currentJourney) return;
    
    if (currentLocationIndex > 0) {
      setCurrentLocationIndex(prev => prev - 1);
    }
  };

  // This would actually generate a video in a real implementation
  const generateVideo = async (): Promise<string | null> => {
    if (!currentJourney) return null;
    
    setIsGeneratingVideo(true);
    
    try {
      // Simulate video generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setCurrentStage(TravelStage.PREVIEW);
      toast({
        title: "Video created",
        description: "Your travel video is ready to preview and download.",
      });
      
      // In a real implementation, this would return a URL to the generated video
      return "https://example.com/video.mp4";
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast({
        title: "Failed to generate video",
        description: "There was an error creating your video. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const value: TravelContextType = {
    locations,
    currentJourney,
    playbackStatus,
    currentStage,
    currentLocationIndex,
    mapboxToken,
    isGeneratingVideo,
    
    addLocation,
    removeLocation,
    reorderLocations,
    clearLocations,
    createJourney,
    setPlaybackStatus,
    nextLocation,
    previousLocation,
    setCurrentStage,
    setMapboxToken,
    generateVideo,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};
