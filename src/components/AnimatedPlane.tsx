
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Plane } from 'lucide-react';

interface AnimatedPlaneProps {
  startCoordinates: [number, number];
  endCoordinates: [number, number];
  isActive: boolean;
  mapInstance: mapboxgl.Map | null;
}

const AnimatedPlane: React.FC<AnimatedPlaneProps> = ({
  startCoordinates,
  endCoordinates,
  isActive,
  mapInstance
}) => {
  const planeElement = useRef<HTMLDivElement | null>(null);
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    if (!isActive || !mapInstance) return;
    
    // Calculate rotation angle between points
    const dx = endCoordinates[0] - startCoordinates[0];
    const dy = endCoordinates[1] - startCoordinates[1];
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    setRotation(angle);
    
    // Create plane element if it doesn't exist
    if (!planeElement.current) {
      const el = document.createElement('div');
      el.className = 'plane-container';
      el.innerHTML = `
        <div class="plane-icon bg-primary text-white rounded-full p-1 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>
      `;
      
      planeElement.current = el;
      document.body.appendChild(el);
    }
    
    // Animate the plane along the route
    const startPoint = mapInstance.project(startCoordinates as mapboxgl.LngLatLike);
    const endPoint = mapInstance.project(endCoordinates as mapboxgl.LngLatLike);
    
    if (planeElement.current) {
      planeElement.current.style.position = 'absolute';
      planeElement.current.style.zIndex = '1000';
      planeElement.current.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      planeElement.current.style.left = `${startPoint.x}px`;
      planeElement.current.style.top = `${startPoint.y}px`;
      
      // Create animation
      planeElement.current.animate(
        [
          {
            left: `${startPoint.x}px`,
            top: `${startPoint.y}px`,
            opacity: 0
          },
          {
            left: `${startPoint.x}px`,
            top: `${startPoint.y}px`,
            opacity: 1,
            offset: 0.1
          },
          {
            left: `${endPoint.x}px`,
            top: `${endPoint.y}px`,
            opacity: 1,
            offset: 0.9
          },
          {
            left: `${endPoint.x}px`,
            top: `${endPoint.y}px`,
            opacity: 0
          }
        ],
        {
          duration: 4000,
          easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          fill: 'forwards'
        }
      );
    }
    
    // Cleanup
    return () => {
      if (planeElement.current) {
        planeElement.current.remove();
        planeElement.current = null;
      }
    };
  }, [isActive, mapInstance, startCoordinates, endCoordinates]);
  
  return null; // Rendering is handled by the DOM manipulation above
};

export default AnimatedPlane;
