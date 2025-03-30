// components/BaseMap.tsx
import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { FaTrophy, FaBaseballBall } from 'react-icons/fa';

interface ViewBox {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface GeoJSON {
  type: string;
  features: Array<{
    geometry: {
      type: string;
      coordinates: any[];
    };
    properties: Record<string, any>;
  }>;
}

interface BaseMapProps {
  geoJsonData: GeoJSON;
  viewBox: ViewBox;
  scale: number;
  translateX: number;
  translateY: number;
  setScale: (scale: number) => void;
  setTranslateX: (x: number) => void;
  setTranslateY: (y: number) => void;
  children?: ReactNode;
}

const BaseMap: React.FC<BaseMapProps> = ({
  geoJsonData,
  viewBox,
  scale,
  translateX,
  translateY,
  setScale,
  setTranslateX,
  setTranslateY,
  children
}) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Handle mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY * -0.01;
    const newScale = Math.max(0.5, Math.min(5, scale + scaleChange));
    setScale(newScale);
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;
    
    setTranslateX(translateX + dx / scale);
    setTranslateY(translateY + dy / scale);
    
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // Important to prevent page scrolling/zooming
    
    if (e.touches.length === 2) {
      // Get distance between two touches for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault(); // Important to prevent default browser behavior
    
    // Handle pinch zoom
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Calculate zoom factor
      const factor = 0.01; // Adjust sensitivity here
      const delta = (currentDistance - lastTouchDistance) * factor;
      const newScale = Math.max(0.5, Math.min(5, scale + delta));
      
      setScale(newScale);
      setLastTouchDistance(currentDistance);
    }
    // Handle single touch drag
    else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPosition.current.x;
      const dy = e.touches[0].clientY - lastPosition.current.y;
      
      // Apply sensitivity based on current zoom
      const sensitivity = scale > 1 ? 1.0 + (scale - 1) * 0.5 : 1.0;
      
      // Calculate new positions with boundaries
      const newTranslateX = translateX + (dx / scale) * sensitivity;
      const newTranslateY = translateY + (dy / scale) * sensitivity;
      
      // Limit panning based on zoom level
      const maxPanDistance = Math.max(viewBox.width, viewBox.height) * 0.5 * scale;
      
      setTranslateX(Math.max(Math.min(newTranslateX, maxPanDistance), -maxPanDistance));
      setTranslateY(Math.max(Math.min(newTranslateY, maxPanDistance), -maxPanDistance));
      
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setLastTouchDistance(null);
  };

  // Add event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      // Add wheel event for zooming
      svg.addEventListener('wheel', handleWheel, { passive: false });
      
      // Add touch events for mobile - passive: false is crucial here
      svg.addEventListener('touchstart', handleTouchStart, { passive: false });
      svg.addEventListener('touchmove', handleTouchMove, { passive: false });
      svg.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      // Add global mouse events for dragging
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Add touch-action: none to element style directly
      svg.style.touchAction = 'none';
      
      return () => {
        // Remove all listeners on cleanup
        svg.removeEventListener('wheel', handleWheel);
        svg.removeEventListener('touchstart', handleTouchStart);
        svg.removeEventListener('touchmove', handleTouchMove);
        svg.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [scale, translateX, translateY]);
  
  // Function to convert GeoJSON coordinates to SVG path
  const coordinatesToPath = (coordinates: number[][][], viewBox: ViewBox): string => {
    if (!coordinates || !coordinates.length || !coordinates[0] || !coordinates[0].length) {
      return '';
    }

    try {
      const polygons = coordinates.map(polygon => {
        const points = polygon.map(point => {
          // Skip invalid or infinite coordinates
          if (!Array.isArray(point) || point.length < 2 || 
              !isFinite(point[0]) || !isFinite(point[1]) ||
              point[0] === null || point[1] === null) {
            return null;
          }
          
          const x = ((point[0] - viewBox.minLon) / (viewBox.maxLon - viewBox.minLon)) * viewBox.width;
          const y = viewBox.height - ((point[1] - viewBox.minLat) / (viewBox.maxLat - viewBox.minLat)) * viewBox.height;
          
          // Ensure x and y are valid numbers
          if (!isFinite(x) || !isFinite(y)) {
            return null;
          }
          
          return `${x},${y}`;
        }).filter(Boolean); // Remove null points
        
        if (points.length === 0) return '';
        
        return `M${points.join(' L')}Z`;
      }).filter(path => path !== '');

      return polygons.join(' ');
    } catch (error) {
      console.error('Error converting coordinates to path:', error);
      return '';
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 w-full h-full">
      <div className="bg-green-800 px-4 py-3 md:px-5 md:py-3 rounded-lg mx-2.5 md:mx-2.5 mt-2.5 mb-2 md:my-2 shadow-md">
        <div className="flex justify-center items-center mb-1">
          <FaTrophy className="mx-2 text-2xl text-yellow-400" />
          <h1 className="text-xl font-bold text-center text-white m-0">IPL Fan Map 2025</h1>
          <FaBaseballBall className="mx-2 text-2xl text-yellow-400" />
        </div>
        <p className="text-sm text-center text-teal-50 font-medium m-0">Vote for your favourite team and see who's winning India's heart</p>
      </div>
      
      <div 
        className="flex-1 h-full mx-2.5 mb-2.5 rounded-lg overflow-hidden bg-white shadow-md cursor-grab relative select-none"
        ref={svgRef}
        onMouseDown={handleMouseDown}
        style={{ touchAction: 'none' }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          aria-label="Interactive map of India with hexagonal regions"
          className="active:cursor-grabbing"
        >
          {/* Using transform-origin to zoom from center */}
          <g 
            transform={`translate(${viewBox.width/2}, ${viewBox.height/2}) scale(${scale}) translate(${translateX - viewBox.width/2}, ${translateY - viewBox.height/2})`}
          >
            {/* Draw India map */}
            {geoJsonData.features.map((feature, index) => {
              let pathData = '';
              
              try {
                if (feature.geometry.type === 'Polygon') {
                  pathData = coordinatesToPath([feature.geometry.coordinates[0]], viewBox);
                } else if (feature.geometry.type === 'MultiPolygon') {
                  const outerRings = feature.geometry.coordinates.map(polygon => polygon[0]);
                  pathData = coordinatesToPath(outerRings, viewBox);
                }
              } catch (error) {
                console.error(`Error processing feature ${index}:`, error);
              }
              
              // Only render if we have valid path data
              if (!pathData) return null;
              
              return (
                <path
                  key={`state-${index}`}
                  d={pathData}
                  fill="#e6f2ff"  // Light blue background
                  stroke="#0066cc"  // Blue border
                  strokeWidth="1"
                  fillOpacity="0.9"
                />
              );
            })}
            
            {/* Insert children components (e.g., HexagonDrawing) */}
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default BaseMap;