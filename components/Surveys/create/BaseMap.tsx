// components/BaseMap.tsx
import React from 'react';

// Types
interface ViewBoxType {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

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

interface IndiaBaseMapProps {
  geoJsonData: GeoJSON;
  viewBox: ViewBoxType;
}

const BaseMap: React.FC<IndiaBaseMapProps> = ({ 
  geoJsonData,
  viewBox
}) => {
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

  return (
    <g>
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
            fill="#e6f2ff"
            stroke="#0066cc"
            strokeWidth="1"
            fillOpacity="0.9"
          />
        );
      })}
    </g>
  );
};

export default BaseMap;