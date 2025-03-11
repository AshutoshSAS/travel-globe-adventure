
import React, { useState, useEffect, useRef } from 'react';
import { Location, Photo, MapboxGeocodeResult } from '../types';
import { useTravelContext } from '../context/TravelContext';
import { geocodeLocation, getPlacePhotos } from '../utils/mapboxService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  X, 
  Search, 
  Map, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plane,
  LoaderCircle
} from 'lucide-react';

const LocationInput: React.FC = () => {
  const { 
    locations,
    addLocation,
    removeLocation,
    reorderLocations,
    clearLocations,
    createJourney,
    mapboxToken,
    setMapboxToken
  } = useTravelContext();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MapboxGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isCreatingJourney, setIsCreatingJourney] = useState<boolean>(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const [mapboxTokenInput, setMapboxTokenInput] = useState<string>('');
  
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;
    
    try {
      setIsSearching(true);
      const results = await geocodeLocation(searchQuery.trim(), mapboxToken);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Could not find that location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim() && mapboxToken) {
      searchTimeoutRef.current = window.setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, mapboxToken]);
  
  const handleLocationSelect = async (result: MapboxGeocodeResult) => {
    try {
      // Fetch photos for this location
      const photoUrls = await getPlacePhotos(result.center, result.place_name);
      
      const photos: Photo[] = photoUrls.map(url => ({
        id: uuidv4(),
        url,
        alt: `Photo of ${result.place_name}`
      }));
      
      // Add new location
      addLocation({
        name: result.place_name,
        coordinates: result.center,
        photos
      });
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      
      toast({
        title: 'Location added',
        description: `${result.place_name} has been added to your journey.`
      });
    } catch (error) {
      console.error('Failed to add location:', error);
      toast({
        title: 'Failed to add location',
        description: 'Could not add this location. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleMoveLocation = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < locations.length) {
      reorderLocations(index, newIndex);
    }
  };
  
  const handleStartJourney = async () => {
    if (locations.length < 2) {
      toast({
        title: 'Not enough locations',
        description: 'Please add at least two locations to create a journey.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreatingJourney(true);
    try {
      await createJourney();
    } finally {
      setIsCreatingJourney(false);
    }
  };
  
  const handleSetMapboxToken = () => {
    if (!mapboxTokenInput.trim()) {
      toast({
        title: 'Token required',
        description: 'Please enter a valid Mapbox token.',
        variant: 'destructive'
      });
      return;
    }
    
    setMapboxToken(mapboxTokenInput);
    toast({
      title: 'Token saved',
      description: 'Your Mapbox token has been saved.'
    });
  };
  
  return (
    <div className="animate-fade-in space-y-6 max-w-xl mx-auto p-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-medium tracking-tight">Travel Journey</h1>
        <p className="text-muted-foreground">
          Add locations to create your personalized travel journey
        </p>
      </div>
      
      {!mapboxToken ? (
        <Card className="animate-slide-up">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="mapbox-token">Mapbox Access Token</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Visit <a href="https://mapbox.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  mapbox.com
                </a> to get your public token
              </div>
              <div className="flex space-x-2">
                <Input
                  id="mapbox-token"
                  placeholder="Enter your Mapbox public token"
                  value={mapboxTokenInput}
                  onChange={e => setMapboxTokenInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSetMapboxToken}>
                  Save Token
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative animate-slide-up">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search for a city, address, or place"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {isSearching && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-input rounded-md shadow-md p-2 z-10">
                <div className="flex items-center justify-center py-6">
                  <LoaderCircle className="animate-spin h-6 w-6 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Searching...</span>
                </div>
              </div>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-input rounded-md shadow-md overflow-hidden z-10">
                <ul className="max-h-60 overflow-auto divide-y divide-border">
                  {searchResults.map(result => (
                    <li key={result.id} className="p-2 hover:bg-secondary transition-colors cursor-pointer">
                      <button
                        className="w-full text-left flex items-start py-1"
                        onClick={() => handleLocationSelect(result)}
                      >
                        <Map className="h-4 w-4 text-muted-foreground mt-1 mr-2 flex-shrink-0" />
                        <span className="text-sm">{result.place_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {locations.length > 0 && (
            <div className="animate-slide-up space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Your locations ({locations.length})</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearLocations}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
              
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div 
                    key={location.id}
                    className="flex items-center space-x-2 p-3 bg-background border border-input rounded-md animate-scale"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{location.name}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveLocation(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveLocation(index, 'down')}
                        disabled={index === locations.length - 1}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocation(location.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleStartJourney}
                  disabled={locations.length < 2 || isCreatingJourney}
                >
                  {isCreatingJourney ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating Journey...
                    </>
                  ) : (
                    <>
                      <Plane className="mr-2 h-4 w-4" />
                      Start Journey
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationInput;
