'use client'

import React, { useEffect } from 'react';

interface MarkerPullRefreshPreventionProps {
  children: React.ReactNode;
}

const MarkerPullRefreshPrevention: React.FC<MarkerPullRefreshPreventionProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to find if the touch is on a marker or popup
    const isMarkerOrPopupElement = (element: HTMLElement | null): boolean => {
      while (element) {
        // Check for your specific marker and popup classes
        if (
          // Marker image
          element.classList.contains('w-7') && element.classList.contains('h-7') ||
          // Marker name span
          (element.tagName.toLowerCase() === 'span' && 
           element.classList.contains('mt-1') && 
           element.classList.contains('text-[0.75rem]')) ||
          // Popup
          element.classList.contains('custom-popup') ||
          // Marker container div
          (element.classList.contains('relative') && 
           element.classList.contains('flex') && 
           element.classList.contains('flex-col'))
        ) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Only prevent default if the touch is on a marker or popup
      if (isMarkerOrPopupElement(target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return <>{children}</>;
};

export default MarkerPullRefreshPrevention;