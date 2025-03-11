
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
  
  // Filter photos to prioritize user uploaded ones
  const userUploadedPhotos = location.photos.filter(photo => photo.isUserUploaded);
  const systemPhotos = location.photos.filter(photo => !photo.isUserUploaded);
  
  // Prioritize user uploaded photos
  const prioritizedPhotos = [...userUploadedPhotos, ...systemPhotos];
  
  if (prioritizedPhotos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">No photos available for this location</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 animate-fade-in">
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
          {prioritizedPhotos[currentPhotoIndex] && (
            <img
              src={prioritizedPhotos[currentPhotoIndex].url}
              alt={prioritizedPhotos[currentPhotoIndex].alt}
              className="w-full h-full object-cover transition-opacity duration-500"
              loading="lazy"
            />
          )}
        </div>
        
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-3">
          {prioritizedPhotos.slice(0, 4).map((photo, index) => (
            index !== currentPhotoIndex && (
              <div 
                key={photo.id}
                className="aspect-[4/3] overflow-hidden rounded-lg bg-muted/30 cursor-pointer"
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
        {prioritizedPhotos.map((_, index) => (
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
