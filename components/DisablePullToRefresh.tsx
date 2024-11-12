'use client'

import React, { useEffect } from 'react';

interface MapPullRefreshPreventionProps {
  children: React.ReactNode;
}

const MapPullRefreshPrevention: React.FC<MapPullRefreshPreventionProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to find the closest parent with a specific class
    const isMapElement = (element: HTMLElement | null): boolean => {
      while (element) {
        if (element.classList.contains('mapboxgl-map')) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Only prevent default if the touch is on the map
      if (isMapElement(target)) {
        const touchY = e.touches[0].clientY;
        const mapElement = document.querySelector('.mapboxgl-map') as HTMLElement;
        
        if (mapElement) {
          const mapRect = mapElement.getBoundingClientRect();
          // Prevent pull-to-refresh only when touching near the top of the map
          if (touchY - mapRect.top < 50) {
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return <>{children}</>;
};

export default MapPullRefreshPrevention;