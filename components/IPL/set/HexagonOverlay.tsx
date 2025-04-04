// components/HexagonOverlay.tsx
import React from 'react';

interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

interface HexagonColors {
  default: string;
  selected: string;
  userHome: string;
  stroke: string;
  selectedStroke: string;
  textDefault: string;
  textSelected: string;
  textUserHome: string;
}

interface HexagonOverlayProps {
  hexagons: Hexagon[];
  selectedHexagon: Hexagon | null;
  userHomeHexagon: string | null;
  onHexagonClick: (hexagon: Hexagon) => void;
}

const HexagonOverlay: React.FC<HexagonOverlayProps> = ({ 
  hexagons, 
  selectedHexagon, 
  userHomeHexagon,
  onHexagonClick 
}) => {
  // Team colors for a cricket feel
  const hexColors: HexagonColors = {
    default: "#E3F2FD", // Light blue background
    selected: "#1A5D1A", // Cricket green for selected
    userHome: "#FFB74D", // Orange for user's home region
    stroke: "#1A5D1A", // Cricket green for borders
    selectedStroke: "#004D40", // Darker green for selected border
    textDefault: "#37474F", // Dark grey for normal text
    textSelected: "#FFFFFF", // White for selected text
    textUserHome: "#37474F" // Dark grey for user home text
  };

  // Helper function to determine hexagon fill color
  const getHexagonFillColor = (hexagon: Hexagon): string => {
    // First priority: currently selected hexagon
    if (selectedHexagon?.id === hexagon.id) {
      return hexColors.selected;
    }
    
    // Second priority: user's home hexagon
    if (userHomeHexagon && hexagon.number.toString() === userHomeHexagon) {
      return hexColors.userHome;
    }
    
    // Default color for unselected hexagons
    return hexColors.default;
  };

  // Helper function to determine text color
  const getTextColor = (hexagon: Hexagon): string => {
    if (selectedHexagon?.id === hexagon.id) {
      return hexColors.textSelected;
    }
    
    if (userHomeHexagon && hexagon.number.toString() === userHomeHexagon) {
      return hexColors.textUserHome;
    }
    
    return hexColors.textDefault;
  };

  // Helper function to determine stroke color and width
  const getStrokeProperties = (hexagon: Hexagon) => {
    const isSelected = selectedHexagon?.id === hexagon.id;
    const isUserHome = userHomeHexagon && hexagon.number.toString() === userHomeHexagon;
    
    return {
      stroke: isSelected ? hexColors.selectedStroke : hexColors.stroke,
      strokeWidth: isSelected || isUserHome ? 2 : 1
    };
  };

  // Show instruction overlay only when no hexagon is selected
  const showOverlay = !selectedHexagon && !userHomeHexagon;

  return (
    <>
      {hexagons.map((hexagon) => {
        const isSelected = selectedHexagon?.id === hexagon.id;
        const isUserHome = userHomeHexagon && hexagon.number.toString() === userHomeHexagon;
        const strokeProps = getStrokeProperties(hexagon);
        
        return (
          <g key={hexagon.id} className="cursor-pointer">
            <polygon
              points={hexagon.points}
              fill={getHexagonFillColor(hexagon)}
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
              fill={getTextColor(hexagon)}
              pointerEvents="none"
              className="select-none"
            >
              {hexagon.number}
            </text>
          </g>
        );
      })}

      {/* Moved instruction overlay outside the map */}
      {showOverlay && (
        <g className="region-selection-instruction" data-testid="region-instruction">
          {/* Position this outside the map - adjust these values based on your layout */}
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
            Click on your region
          </text>
        </g>
      )}
    </>
  );
};

export default HexagonOverlay;