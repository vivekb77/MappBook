// /DrawHexagon.tsx
import React from 'react';
import { Hexagon } from './utils/MapLogic';
import { 
  defaultHexColors, 
  getHexagonFillColor, 
  getTextColor, 
  getStrokeProperties 
} from './utils/HexagonLogic';

interface DrawHexagonProps {
  hexagons: Hexagon[];
  selectedHexagon: Hexagon | null;
  userHomeHexagon: string | null;
  onHexagonClick: (hexagon: Hexagon) => void;
}

const DrawHexagon: React.FC<DrawHexagonProps> = ({ 
  hexagons, 
  selectedHexagon, 
  userHomeHexagon,
  onHexagonClick 
}) => {
  // Show instruction overlay only when no hexagon is selected
  const showOverlay = !selectedHexagon && !userHomeHexagon;
  
  return (
    <>
      {hexagons.map((hexagon) => {
        const isSelected = selectedHexagon?.id === hexagon.id;
        const isUserHome = userHomeHexagon && hexagon.number.toString() === userHomeHexagon;
        const strokeProps = getStrokeProperties(hexagon, selectedHexagon, userHomeHexagon, defaultHexColors);
        
        return (
          <g key={hexagon.id} className="cursor-pointer">
            <polygon
              points={hexagon.points}
              fill={getHexagonFillColor(hexagon, selectedHexagon, userHomeHexagon, defaultHexColors)}
              stroke={strokeProps.stroke}
              strokeWidth={strokeProps.strokeWidth}
              fillOpacity="0.85"
              onClick={() => onHexagonClick(hexagon)}
              aria-label={`Hexagon region ${hexagon.number}${isUserHome ? ', your home region' : ''}`}
            />
            <text
              x={hexagon.centerX}
              y={hexagon.centerY + 5}
              fontSize="14"
              fontWeight={isSelected || isUserHome ? "bold" : "normal"}
              textAnchor="middle"
              fill={getTextColor(hexagon, selectedHexagon, userHomeHexagon, defaultHexColors)}
              pointerEvents="none"
              className="select-none"
            >
              {hexagon.number}
            </text>
          </g>
        );
      })}

      {/* Instruction overlay */}
      {showOverlay && (
        <g className="region-selection-instruction">
          <rect
            x="10"  
            y="10"
            width="200"
            height="50"
            rx="10"
            ry="10"
            fill="rgba(255, 255, 255, 0.85)"
            stroke="#1A5D1A"
            strokeWidth="2"
          />
          <text
            x="110"  
            y="40"
            fontSize="15"
            fontWeight="bold"
            textAnchor="middle"
            fill="#1A5D1A"
            className="select-none"
          >
            Click on a region
          </text>
        </g>
      )}
    </>
  );
};

export default DrawHexagon;