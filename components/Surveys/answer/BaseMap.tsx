// components/BaseMap.tsx
import React, { useRef, useEffect, ReactNode } from 'react';
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
  let lastDistance = 0;
  let lastX = 0;
  let lastY = 0;

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
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - lastX;
      const dy = moveEvent.clientY - lastY;
      
      setTranslateX(translateX + dx / scale);
      setTranslateY(translateY + dy / scale);
      
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Get distance between two touches for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    
    // Handle pinch zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastDistance > 0) {
        const newScale = scale * (currentDistance / lastDistance);
        if (newScale >= 0.5 && newScale <= 5) {
          setScale(newScale);
        }
      }
      
      lastDistance = currentDistance;
    } 
    // Handle single touch drag
    else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      
      setTranslateX(translateX + dx / scale);
      setTranslateY(translateY + dy / scale);
      
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    lastDistance = 0;
  };

  // Add event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
      svg.addEventListener('touchstart', handleTouchStart);
      svg.addEventListener('touchmove', handleTouchMove, { passive: false });
      svg.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        svg.removeEventListener('wheel', handleWheel);
        svg.removeEventListener('touchstart', handleTouchStart);
        svg.removeEventListener('touchmove', handleTouchMove);
        svg.removeEventListener('touchend', handleTouchEnd);
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
    <div className="container">
      <div className="titleContainer">
        <div className="titleRow">
          <FaTrophy className="titleIcon" style={{ color: '#FFD700' }} />
          <h1 className="mainTitle">IPL Fan Map 2025</h1>
          <FaBaseballBall className="titleIcon" style={{ color: '#FFD700' }} />
        </div>
        <p className="subtitle">Vote for your favourite team and see who's winning India's heart</p>
      </div>
      
      <div 
        className="mapContainer"
        ref={svgRef}
        onMouseDown={handleMouseDown}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          aria-label="Interactive map of India with hexagonal regions"
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
                  fill="#e6f2ff"  // Light cricket green background
                  stroke="#0066cc"  // Cricket green border
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

      <style jsx>{`
        .container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #F5F5F5;
          width: 100%;
          height: 100%;
        }
        .titleContainer {
          background-color: #1A5D1A;
          padding: 12px 20px;
          border-radius: 10px;
          margin: 10px 10px 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .titleRow {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 5px;
        }
        .titleIcon {
          margin: 0 8px;
          font-size: 24px;
        }
        .mainTitle {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          color: #ffffff;
          margin: 0;
        }
        .subtitle {
          font-size: 14px;
          text-align: center;
          color: #E0F2F1;
          font-weight: 500;
          margin: 0;
        }
        .mapContainer {
          flex: 1;
          margin: 10px;
          border-radius: 10px;
          overflow: hidden;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: grab;
          position: relative;
        }
        .mapContainer:active {
          cursor: grabbing;
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .titleContainer {
            margin: 5px 5px 5px;
            padding: 8px 10px;
          }
          .titleIcon {
            font-size: 20px;
            margin: 0 5px;
          }
          .mainTitle {
            font-size: 18px;
          }
          .subtitle {
            font-size: 12px;
          }
          .mapContainer {
            margin: 5px;
          }
        }

        @media (max-width: 480px) {
          .titleRow {
            flex-wrap: wrap;
          }
          .titleIcon {
            font-size: 18px;
          }
          .mainTitle {
            font-size: 16px;
          }
          .subtitle {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default BaseMap;