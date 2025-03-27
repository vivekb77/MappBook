// components/BaseMap.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Type definitions
interface Geometry {
  type: string;
  coordinates: any[];
}

interface Feature {
  type: string;
  properties: {
    name?: string;
    [key: string]: any;
  };
  geometry: Geometry;
}

interface GeoJSON {
  type: string;
  features: Feature[];
}

interface ViewBoxType {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface BaseMapProps {
  viewBox: ViewBoxType;
  scale: number;
  translateX: number;
  translateY: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setTranslateX: React.Dispatch<React.SetStateAction<number>>;
  setTranslateY: React.Dispatch<React.SetStateAction<number>>;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  geoJsonPath?: string; // Path to the GeoJSON file in public folder
}

const BaseMap: React.FC<BaseMapProps> = ({
  viewBox,
  scale,
  translateX,
  translateY,
  setScale,
  setTranslateX,
  setTranslateY,
  children,
  title = "Survey Map",
  subtitle = "Interactive geographic survey visualization",
  geoJsonPath = "/data/india-states.json" // Default path
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [lastDistance, setLastDistance] = useState(0);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load GeoJSON directly from public folder
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch(geoJsonPath);
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON from ${geoJsonPath}`);
        }
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
        // Fallback to a simple polygon
        setGeoJsonData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Sample Region" },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [-5, -5], [5, -5], [5, 5], [-5, 5], [-5, -5]
                ]]
              }
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoJson();
  }, [geoJsonPath]);

  // Function to convert GeoJSON coordinates to SVG path
  const coordinatesToPath = (coordinates: number[][][], viewBox: ViewBoxType): string => {
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

  // Mouse events for panning
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const dx = e.clientX - lastPosition.x;
      const dy = e.clientY - lastPosition.y;
      
      setTranslateX(prev => prev + dx / scale);
      setTranslateY(prev => prev + dy / scale);
      
      setLastPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, lastPosition, scale, setTranslateX, setTranslateY]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel event for zooming
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    setScale(newScale);
  }, [scale, setScale]);

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      // Single touch for panning
      setIsDragging(true);
      setLastPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Two touches for pinch zoom
      setIsPinching(true);
      const distance = getDistanceBetweenTouches(e.touches[0], e.touches[1]);
      setLastDistance(distance);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    
    if (isDragging && e.touches.length === 1) {
      // Handle panning
      const dx = e.touches[0].clientX - lastPosition.x;
      const dy = e.touches[0].clientY - lastPosition.y;
      
      setTranslateX(prev => prev + dx / scale);
      setTranslateY(prev => prev + dy / scale);
      
      setLastPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (isPinching && e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = getDistanceBetweenTouches(e.touches[0], e.touches[1]);
      
      if (lastDistance > 0) {
        const factor = currentDistance / lastDistance;
        const newScale = Math.max(0.5, Math.min(5, scale * factor));
        setScale(newScale);
      }
      
      setLastDistance(currentDistance);
    }
  }, [isDragging, isPinching, lastPosition, lastDistance, scale, setTranslateX, setTranslateY, setScale]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsPinching(false);
    setLastDistance(0);
  }, []);

  // Helper function to calculate distance between two touch points
  const getDistanceBetweenTouches = (touch1: React.Touch, touch2: React.Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50">
        <div className="bg-green-800 py-3 px-5 rounded-lg mx-4 mt-4 mb-2 shadow-md">
          <h2 className="text-xl font-bold text-white text-center">{title}</h2>
        </div>
        <div className="flex-1 mx-4 mb-4 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
            <p className="mt-2 text-green-800">Loading map data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className="bg-green-800 py-3 px-5 rounded-lg mx-4 mt-4 mb-2 shadow-md">
        <div className="flex items-center justify-center mb-1">
          <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <h2 className="text-xl font-bold text-white text-center">{title}</h2>
          <svg className="w-6 h-6 text-yellow-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        </div>
        <p className="text-sm text-gray-100 text-center">{subtitle}</p>
      </div>
      <div className="flex-1 mx-4 mb-4 rounded-lg overflow-hidden bg-white shadow-md">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Using transform-origin to zoom from center */}
          <g 
            transform={`translate(${viewBox.width/2}, ${viewBox.height/2}) scale(${scale}) translate(${translateX - viewBox.width/2}, ${translateY - viewBox.height/2})`}
          >
            {/* Draw map */}
            {geoJsonData && geoJsonData.features.map((feature, index) => {
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
                  key={`region-${index}`}
                  d={pathData}
                  fill="#e6f2ff"  // Light background
                  stroke="#0066cc"  // Border
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