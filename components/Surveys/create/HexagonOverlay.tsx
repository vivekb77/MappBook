// components/HexagonOverlay.tsx
import React, { useState, useEffect } from 'react';

// Team data interface
interface TeamData {
  team: string;
  count: number;
  percentage: number;
}

interface HexagonData {
  teams: TeamData[];
  total_fans: number;
  home_hexagon: number;
  dominant_team: string;
  dominance_percentage: number;
}

// Types
interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

interface GeoJSON {
  type: string;
  features: Feature[];
}

interface Feature {
  type: string;
  properties: {
    name?: string;
    [key: string]: any;
  };
  geometry: Geometry;
}

interface Geometry {
  type: string;
  coordinates: any[];
}

interface ViewBoxType {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface HexagonOverlayProps {
  geoJsonData: GeoJSON;
  viewBox: ViewBoxType;
  selectedHexagon: Hexagon | null;
  onHexagonClick: (hexagon: Hexagon, hexagonData: HexagonData) => void;
  onDataFetched: (data: any) => void;
}

const HexagonOverlay: React.FC<HexagonOverlayProps> = ({ 
  geoJsonData, 
  viewBox, 
  selectedHexagon,
  onHexagonClick,
  onDataFetched
}) => {
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [hexagonData, setHexagonData] = useState<HexagonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Team colors for the IPL teams
  const teamColors = {
    'Chennai Super Kings': '#FFDC00',     // Yellow
    'Delhi Capitals': '#0033A0',          // Blue
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Kolkata Knight Riders': '#552583',   // Purple
    'Lucknow Super Giants': '#005CB9',    // Royal Blue
    'Mumbai Indians': '#004C93',          // Blue
    'Punjab Kings': '#ED1B24',            // Red
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Sunrisers Hyderabad': '#FF6500'      // Orange
  };

  useEffect(() => {
    if (geoJsonData && viewBox) {
      generateHexagonsFromData(viewBox);
    }
  }, [geoJsonData, viewBox]);

  useEffect(() => {
    // Fetch hexagon data from the API endpoint
    fetchHexagonData();
  }, []);

  // Function to fetch data from the API endpoint
  const fetchHexagonData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real application, you would fetch from your API
      const response = await fetch('/api/pull-survey-data');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setHexagonData(data.data.hexagons || []);
        // Pass the complete data to parent component
        onDataFetched(data);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching hexagon data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate hexagons dynamically across the India map
  const generateHexagonsFromData = (viewBox: ViewBoxType) => {
    try {
      // Convert 120km to pixels based on map scale
      // Approximate width of India in degrees of longitude (68°E to 97°E)
      const indiaLongSpan = viewBox.maxLon - viewBox.minLon; // in degrees
      // Approximate height of India in degrees of latitude (8°N to 37°N)
      const indiaLatSpan = viewBox.maxLat - viewBox.minLat; // in degrees
      
      // Approximate width and height of India in km
      const indiaWidthKm = 3000;
      const indiaHeightKm = 3200;
      
      // Calculate scales
      const kmPerLongDegree = indiaWidthKm / indiaLongSpan;
      const kmPerLatDegree = indiaHeightKm / indiaLatSpan;
      
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
          
          // Check if the hexagon's center is likely inside India using the point-in-polygon algorithm
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
      
      setHexagons(hexList);
    } catch (error) {
      console.error('Error generating hexagons:', error);
      setHexagons([]);
    }
  };

  // Function to check if a point is inside India using point-in-polygon algorithm
  const isPointInsideIndia = (lon: number, lat: number, geoJson: GeoJSON): boolean => {
    if (!geoJson || !geoJson.features) return false;
    
    try {
      for (const feature of geoJson.features) {
        if (feature.geometry.type === 'Polygon') {
          if (isPointInPolygon(lon, lat, feature.geometry.coordinates[0])) {
            return true;
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          for (const polygon of feature.geometry.coordinates) {
            if (isPointInPolygon(lon, lat, polygon[0])) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in point-in-polygon check:', error);
    }
    
    return false;
  };
  
  // Ray casting algorithm for point in polygon
  const isPointInPolygon = (lon: number, lat: number, polygon: number[][]): boolean => {
    if (!polygon || !Array.isArray(polygon)) return false;
    
    try {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        // Skip invalid coordinates
        if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) {
          continue;
        }
        
        const intersect = ((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    } catch (error) {
      console.error('Error in point-in-polygon algorithm:', error);
      return false;
    }
  };

  // Calculate hexagon corner points
  const calculateHexagonPoints = (centerX: number, centerY: number, radius: number): string => {
    try {
      const points = [];
      
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

  // Function to get fill color based on team and dominance percentage
  const getHexagonFillColor = (hexNumber: number): string => {
    // Find data for this hexagon
    const data = hexagonData.find(data => data.home_hexagon === hexNumber);
    
    if (!data) {
      return "#e8e8e8"; // Lighter color for hexagons without data
    }
    
    const team = data.dominant_team;
    const baseColor = teamColors[team as keyof typeof teamColors] || "#cccccc";
    
    // Adjust color shade based on dominance percentage
    if (data.dominance_percentage >= 75) {
      // Darken the color for high dominance (75-100%)
      return adjustColorShade(baseColor, -30); // Darker
    } else if (data.dominance_percentage >= 50) {
      // Slightly darken for medium dominance (50-75%)
      return adjustColorShade(baseColor, -15); // Slightly darker
    } else if (data.dominance_percentage >= 25) {
      // Use base color for low-medium dominance (25-50%)
      return baseColor;
    } else {
      // Lighten for very low dominance (<25%)
      return adjustColorShade(baseColor, 30); // Lighter
    }
  };

  // Function to adjust color shade (darken/lighten)
  const adjustColorShade = (hex: string, percent: number): string => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust shade
    r = Math.min(255, Math.max(0, r + Math.floor(r * percent / 100)));
    g = Math.min(255, Math.max(0, g + Math.floor(g * percent / 100)));
    b = Math.min(255, Math.max(0, b + Math.floor(b * percent / 100)));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Handle hexagon click - send data to parent component
  const handleHexagonClick = (hexagon: Hexagon) => {
    // Only handle click if there's data for this hexagon
    const data = hexagonData.find(data => data.home_hexagon === hexagon.number);
    if (data) {
      onHexagonClick(hexagon, data);
    }
  };

  // Show loading state while fetching data
  if (isLoading && hexagonData.length === 0) {
    return (
      <g>
        {/* Semi-transparent background */}
        <rect 
          x={viewBox.width / 2 - 100}
          y={viewBox.height / 2 - 60}
          width="200"
          height="120"
          rx="10"
          fill="white"
          fillOpacity="0.9"
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        
        {/* Border-style spinner - similar to the reference */}
        <path
          d="M 50 34 A 16 16 0 0 1 66 50"
          fill="none" 
          stroke="#1D4ED8"  
          strokeWidth="2"
          strokeLinecap="round"
          transform={`translate(${viewBox.width / 2 - 50}, ${viewBox.height / 2 - 50})`}
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="0.8s" 
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
  
        {/* Loading Text */}
        <text
          x={viewBox.width / 2}
          y={viewBox.height / 2 + 30}
          fontSize="16"
          fontWeight="normal"
          textAnchor="middle"
          fill="#4B5563"
        >
          Loading map data
        </text>
      </g>
    );
  }

  // Show error state if API request failed
  if (error && hexagonData.length === 0) {
    return (
      <g>
        <text
          x={viewBox.width / 2}
          y={viewBox.height / 2}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fill="#FF0000"
        >
          Error loading data: {error}
        </text>
      </g>
    );
  }

  return (
    <>
      {hexagons.map((hexagon) => {
        const hasData = hexagonData.some(data => data.home_hexagon === hexagon.number);
        
        return (
          <g key={hexagon.id}>
            <polygon
              points={hexagon.points}
              fill={hasData ? getHexagonFillColor(hexagon.number) : 
                    (selectedHexagon?.id === hexagon.id ? "#F44336" : "#e8e8e8")}
              stroke="#dddddd"
              strokeWidth="1"
              fillOpacity="0.9"
              onClick={hasData ? () => handleHexagonClick(hexagon) : undefined}
              style={{ cursor: hasData ? 'pointer' : 'default' }}
              aria-label={hasData ? `Hexagon region ${hexagon.number}` : undefined}
            />
            {/* Display hexagon number */}
            <text
              x={hexagon.centerX}
              y={hexagon.centerY}
              fontSize="12"
              fontWeight={hasData ? "bold" : "normal"}
              textAnchor="middle"
              fill="#000"
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

export default HexagonOverlay;