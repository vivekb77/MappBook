// /DrawMap.tsx
import React, { ReactNode } from 'react';
import { ViewBox, GeoJSON, coordinatesToPath } from './utils/MapLogic';

interface DrawMapProps {
  geoJsonData: GeoJSON;
  viewBox: ViewBox;
  scale: number;
  translateX: number;
  translateY: number;
  children?: ReactNode;
}

const DrawMap: React.FC<DrawMapProps> = ({
  geoJsonData,
  viewBox,
  scale,
  translateX,
  translateY,
  children
}) => {
  return (
    <div className="flex flex-col bg-gray-100 w-full h-full">

      {/* SVG Map */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        aria-label="Interactive map of India with hexagonal regions"
      >
        {/* Apply transformation for zoom and pan */}
        <g
          transform={`translate(${viewBox.width / 2}, ${viewBox.height / 2}) scale(${scale}) translate(${translateX - viewBox.width / 2}, ${translateY - viewBox.height / 2})`}
        >
          {/* Draw India map from GeoJSON */}
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

          {/* Insert children components (e.g., HexagonOverlay) */}
          {children}
        </g>
      </svg>
    </div>
  );
};

export default DrawMap;