// components/HexagonDrawing.tsx
import React from 'react';

// Hexagon interface
interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

interface HexagonDrawingProps {
  hexagons: Hexagon[];
  selectedHexagon: Hexagon | null;
  userHomeHexagon: number | null; // User's saved home hexagon
  onHexagonClick: (hexagon: Hexagon) => void;
}

const HexagonDrawing: React.FC<HexagonDrawingProps> = ({ 
  hexagons, 
  selectedHexagon, 
  userHomeHexagon,
  onHexagonClick 
}) => {
  // Team colors for a cricket feel
  const hexColors = {
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
  const getHexagonFillColor = (hexagon: Hexagon) => {
    // First priority: currently selected hexagon
    if (selectedHexagon?.id === hexagon.id) {
      return hexColors.selected;
    }
    
    // Second priority: user's home hexagon
    if (userHomeHexagon && hexagon.number === userHomeHexagon) {
      return hexColors.userHome;
    }
    
    // Default color for unselected hexagons
    return hexColors.default;
  };

  // Helper function to determine text color
  const getTextColor = (hexagon: Hexagon) => {
    if (selectedHexagon?.id === hexagon.id) {
      return hexColors.textSelected;
    }
    
    if (userHomeHexagon && hexagon.number === userHomeHexagon) {
      return hexColors.textUserHome;
    }
    
    return hexColors.textDefault;
  };

  // Helper function to determine stroke color and width
  const getStrokeProperties = (hexagon: Hexagon) => {
    const isSelected = selectedHexagon?.id === hexagon.id;
    const isUserHome = userHomeHexagon && hexagon.number === userHomeHexagon;
    
    return {
      stroke: isSelected ? hexColors.selectedStroke : hexColors.stroke,
      strokeWidth: isSelected || isUserHome ? 2 : 1
    };
  };

  return (
    <>
      {hexagons.map((hexagon) => {
        const isSelected = selectedHexagon?.id === hexagon.id;
        const isUserHome = userHomeHexagon && hexagon.number === userHomeHexagon;
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
              style={{ cursor: 'pointer' }}
              aria-label={`Hexagon region ${hexagon.number}${isUserHome ? ', your home region' : ''}`}
            />
            <text
              x={hexagon.centerX}
              y={hexagon.centerY + 5}
              fontSize="14"
              fontWeight={isSelected || isUserHome ? "bold" : "normal"}
              textAnchor="middle"
              fill={getTextColor(hexagon)}
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