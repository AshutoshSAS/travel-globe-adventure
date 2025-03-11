
import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { formatCoordinates } from '../utils/mapboxService';
import { MapPin } from 'lucide-react';

interface LocationGalleryProps {
  location: Location;
  isActive: boolean;
}

const LocationGallery: React.FC<LocationGalleryProps> = ({ location, isActive }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Auto-rotate photos when active
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCurrentPhotoIndex(prev => 
        prev === location.photos.length - 1 ? 0 : prev + 1
      );
    }, 2500); // Change photo every 2.5 seconds
    
    return () => clearInterval(interval);
  }, [isActive, location.photos.length]);
  
  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
        <div>
          <h2 className="text-xl font-medium">{location.name}</h2>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{formatCoordinates(location.coordinates)}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
        <div className="aspect-[4/3] overflow-hidden rounded-lg md:col-span-2 bg-muted/30">
          {location.photos[currentPhotoIndex] && (
            <img
              src={location.photos[currentPhotoIndex].url}
              alt={location.photos[currentPhotoIndex].alt}
              className="w-full h-full object-cover transition-opacity duration-500"
              loading="lazy"
            />
          )}
        </div>
        
        <div className="hidden md:flex md:col-span-2 space-x-3">
          {location.photos.slice(0, 3).map((photo, index) => (
            index !== currentPhotoIndex && (
              <div 
                key={photo.id}
                className="aspect-[4/3] flex-1 overflow-hidden rounded-lg bg-muted/30"
              >
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onClick={() => setCurrentPhotoIndex(index)}
                />
              </div>
            )
          ))}
        </div>
      </div>
      
      {/* Mobile photo indicators */}
      <div className="flex justify-center space-x-1 md:hidden">
        {location.photos.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentPhotoIndex 
                ? 'w-6 bg-primary' 
                : 'w-1.5 bg-muted-foreground/30'
            }`}
            onClick={() => setCurrentPhotoIndex(index)}
            aria-label={`View photo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default LocationGallery;
