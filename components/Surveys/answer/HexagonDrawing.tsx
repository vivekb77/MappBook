// components/HexagonDrawing.tsx
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

interface HexagonDrawingProps {
  hexagons: Hexagon[];
  selectedHexagon: Hexagon | null;
  userHomeHexagon: string | null;
  onHexagonClick: (hexagon: Hexagon) => void;
}

const HexagonDrawing: React.FC<HexagonDrawingProps> = ({ 
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

  return (
    <>
      {hexagons.map((hexagon) => {
        const isSelected = selectedHexagon?.id === hexagon.id;
        const isUserHome = userHomeHexagon && hexagon.number.toString() === userHomeHexagon;
        const strokeProps = getStrokeProperties(hexagon);
        
        return (
          <g key={hexagon.id}>
            <polygon
              points={hexagon.points}
              fill={getHexagonFillColor(hexagon)}
              stroke={strokeProps.stroke}
              strokeWidth={strokeProps.strokeWidth}
              fillOpacity="0.85"
              onClick={() => onHexagonClick(hexagon)}
              aria-label={`Hexagon region ${hexagon.number}${isUserHome ? ', your home region' : ''}`}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={hexagon.centerX}
              y={hexagon.centerY + 5}
              fontSize="14"
              fontWeight={isSelected || isUserHome ? "bold" : "normal"}
              textAnchor="middle"
              fill={getTextColor(hexagon)}
              pointerEvents="none"
            >
              {hexagon.number}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default HexagonDrawing;