// utils/HexagonLogic.ts
// Contains hexagon generation and styling logic

import { Hexagon, ViewBox, GeoJSON, isPointInsideIndia } from './MapLogic';

export interface HexagonColors {
  default: string;
  selected: string;
  userHome: string;
  stroke: string;
  selectedStroke: string;
  textDefault: string;
  textSelected: string;
  textUserHome: string;
}

// Default hexagon color scheme
export const defaultHexColors: HexagonColors = {
  default: "#E3F2FD", // Light blue background
  selected: "#1A5D1A", // Green for selected
  userHome: "#FFB74D", // Orange for user's home region
  stroke: "#1A5D1A", // Green for borders
  selectedStroke: "#004D40", // Darker green for selected border
  textDefault: "#37474F", // Dark grey for normal text
  textSelected: "#FFFFFF", // White for selected text
  textUserHome: "#37474F" // Dark grey for user home text
};

// Calculate hexagon corner points
export const calculateHexagonPoints = (centerX: number, centerY: number, radius: number): string => {
  try {
    const points: string[] = [];

    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      points.push(`${x},${y}`);
    }

    return points.join(' ');
  } catch (error) {
    console.error('Error calculating hexagon points:', error);
    return '0,0 0,0 0,0 0,0 0,0 0,0'; // Fallback to prevent render failures
  }
};

// Generate hexagons based on viewbox dimensions
export const generateHexagons = (viewBox: ViewBox, geoJsonData: GeoJSON): Hexagon[] => {
  try {
    // Approximate dimensions of India in kilometers
    const indiaWidthKm = 3000;
    const indiaHeightKm = 3200;
    const indiaLongSpan = viewBox.maxLon - viewBox.minLon;
    const indiaLatSpan = viewBox.maxLat - viewBox.minLat;

    // Calculate pixel per km
    const pixelsPerKmLong = viewBox.width / indiaWidthKm;
    const pixelsPerKmLat = viewBox.height / indiaHeightKm;

    // 120km in pixels (approximation)
    const hexSidePixels = 100.7 * ((pixelsPerKmLong + pixelsPerKmLat) / 2);

    // Size of hexagons
    const hexRadius = hexSidePixels;
    const horizontalSpacing = hexRadius * Math.sqrt(3);
    const verticalSpacing = hexRadius * 1.5;

    // Calculate how many hexagons we need to cover the map
    const cols = Math.ceil(viewBox.width / horizontalSpacing) + 2; // Add extra columns for offset rows
    const rows = Math.ceil(viewBox.height / verticalSpacing) + 2; // Add a bit of margin

    // Calculate the starting point for the hexagon grid
    // Start outside the viewport to ensure coverage
    const startX = -horizontalSpacing;
    const startY = -verticalSpacing;

    const hexList: Hexagon[] = [];
    let hexNumber = 1;

    // Create a grid of hexagons
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = (row % 2) * (horizontalSpacing / 2);
        const x = startX + (col * horizontalSpacing) + offsetX;
        const y = startY + (row * verticalSpacing);

        // Convert pixel coordinates back to lat/lon
        const lon = ((x / viewBox.width) * (viewBox.maxLon - viewBox.minLon)) + viewBox.minLon;
        const lat = viewBox.maxLat - ((y / viewBox.height) * (viewBox.maxLat - viewBox.minLat));

        // Check if the hexagon's center is likely inside India
        if (isPointInsideIndia(lon, lat, geoJsonData)) {
          const points = calculateHexagonPoints(x, y, hexRadius);

          hexList.push({
            id: `hex-${row}-${col}`,
            number: hexNumber++,
            points,
            centerX: x,
            centerY: y
          });
        }
      }
    }

    return hexList;
  } catch (error) {
    console.error('Error generating hexagons:', error);
    // Fall back to empty array to prevent app crash
    return [];
  }
};

// Get hexagon fill color based on state
export const getHexagonFillColor = (
  hexagon: Hexagon, 
  selectedHexagon: Hexagon | null, 
  userHomeHexagon: string | null, 
  colors: HexagonColors
): string => {
  // First priority: currently selected hexagon
  if (selectedHexagon?.id === hexagon.id) {
    return colors.selected;
  }
  
  // Second priority: user's home hexagon
  if (userHomeHexagon && hexagon.number.toString() === userHomeHexagon) {
    return colors.userHome;
  }
  
  // Default color for unselected hexagons
  return colors.default;
};

// Get text color for hexagon based on state
export const getTextColor = (
  hexagon: Hexagon, 
  selectedHexagon: Hexagon | null, 
  userHomeHexagon: string | null, 
  colors: HexagonColors
): string => {
  if (selectedHexagon?.id === hexagon.id) {
    return colors.textSelected;
  }
  
  if (userHomeHexagon && hexagon.number.toString() === userHomeHexagon) {
    return colors.textUserHome;
  }
  
  return colors.textDefault;
};

// Get stroke properties for hexagon based on state
export const getStrokeProperties = (
  hexagon: Hexagon,
  selectedHexagon: Hexagon | null, 
  userHomeHexagon: string | null, 
  colors: HexagonColors
) => {
  const isSelected = selectedHexagon?.id === hexagon.id;
  const isUserHome = userHomeHexagon && hexagon.number.toString() === userHomeHexagon;
  
  return {
    stroke: isSelected ? colors.selectedStroke : colors.stroke,
    strokeWidth: isSelected || isUserHome ? 2 : 1
  };
};