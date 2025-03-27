"use client"
// pages/survey-map.tsx
import React, { useState, useEffect } from 'react';





import { useLocalStorage } from '../../../components/Surveys/answer/useLocalStorage';
import BaseMap from '../../../components/Surveys/answer/BaseMap';
import HexagonDrawing from '../../../components/Surveys/answer/HexagonDrawing';
import SurveyPanel from '../../../components/Surveys/answer/SurveyPanel';

// Type definitions
interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

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

const SurveyMapPage: React.FC = () => {
  // State
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON | null>(null);
  
  // Local storage hooks for persisting user preferences
  const [userHomeHexagon, setUserHomeHexagon] = useLocalStorage<number | null>('userHomeHexagon', null);
  const [userChoice, setUserChoice] = useLocalStorage<string>('userChoice', '');
  
  // ViewBox to define the map boundaries
  const [viewBox, setViewBox] = useState<ViewBoxType>({
    width: 900,
    height: 800,
    minLon: 68, // Default values for India map
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // We'll initialize the map with existing GeoJSON data
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch('/india-states.json');
        if (!response.ok) {
          throw new Error('Failed to load GeoJSON data');
        }
        const data = await response.json();
        setGeoJsonData(data);
        
        // Calculate viewbox based on loaded data
        const calculatedViewBox = calculateViewBox(data);
        setViewBox(calculatedViewBox);
        
        // Generate hexagons
        generateHexagonsFromData(calculatedViewBox, data);
        
      } catch (error) {
        console.error('Error loading or processing GeoJSON:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGeoJson();
  }, []);

  // Calculate viewbox dimensions from GeoJSON data
  const calculateViewBox = (geoJson: GeoJSON): ViewBoxType => {
    try {
      // Start with reasonable defaults for India
      let minLon = 68;
      let maxLon = 97;
      let minLat = 8;
      let maxLat = 37;

      // Find the actual boundaries from the GeoJSON
      geoJson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((point: number[]) => {
            if (Array.isArray(point) && point.length >= 2 && 
                isFinite(point[0]) && isFinite(point[1])) {
              minLon = Math.min(minLon, point[0]);
              maxLon = Math.max(maxLon, point[0]);
              minLat = Math.min(minLat, point[1]);
              maxLat = Math.max(maxLat, point[1]);
            }
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(polygon => {
            polygon[0].forEach((point: number[]) => {
              if (Array.isArray(point) && point.length >= 2 && 
                  isFinite(point[0]) && isFinite(point[1])) {
                minLon = Math.min(minLon, point[0]);
                maxLon = Math.max(maxLon, point[0]);
                minLat = Math.min(minLat, point[1]);
                maxLat = Math.max(maxLat, point[1]);
              }
            });
          });
        }
      });

      // Add some padding
      const lonPadding = (maxLon - minLon) * 0.05;
      const latPadding = (maxLat - minLat) * 0.05;

      // Calculate aspect ratio
      const mapWidth = 900;
      const mapHeight = (mapWidth * (maxLat - minLat)) / (maxLon - minLon);

      return {
        minLon: minLon - lonPadding,
        maxLon: maxLon + lonPadding,
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding,
        width: mapWidth,
        height: mapHeight
      };
    } catch (error) {
      console.error('Error calculating viewbox:', error);
      
      // Fallback to default values
      return {
        minLon: 68,
        maxLon: 97,
        minLat: 8,
        maxLat: 37,
        width: 900,
        height: 800
      };
    }
  };

  // Generate hexagons across the map
  const generateHexagonsFromData = (viewBox: ViewBoxType, geoJson: GeoJSON) => {
    try {
      // Size calculations for hexagons
      const hexRadius = 40; // Base size of hexagons
      const horizontalSpacing = hexRadius * Math.sqrt(3);
      const verticalSpacing = hexRadius * 1.5;
      
      // Calculate grid size
      const cols = Math.ceil(viewBox.width / horizontalSpacing) + 2;
      const rows = Math.ceil(viewBox.height / verticalSpacing) + 2;
      
      // Starting point (outside viewport to ensure coverage)
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
          
          // Convert pixel coordinates to lat/lon
          const lon = ((x / viewBox.width) * (viewBox.maxLon - viewBox.minLon)) + viewBox.minLon;
          const lat = viewBox.maxLat - ((y / viewBox.height) * (viewBox.maxLat - viewBox.minLat));
          
          // Check if the hexagon's center is inside our region
          if (isPointInsideRegion(lon, lat, geoJson)) {
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
      return '0,0 0,0 0,0 0,0 0,0 0,0'; // Fallback
    }
  };

  // Check if point is inside region using ray casting algorithm
  const isPointInsideRegion = (lon: number, lat: number, geoJson: GeoJSON): boolean => {
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

  // Handle hexagon click
  const handleHexagonClick = (hexagon: Hexagon) => {
    setSelectedHexagon(hexagon);
    setIsPanelVisible(true);
  };

  // Toggle panel visibility
  const togglePanelVisibility = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  // Handle user selection
  const handleUserSelection = (hexagonNumber: number | null, choice: string) => {
    setUserHomeHexagon(hexagonNumber);
    setUserChoice(choice);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-lg text-green-800 font-medium">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header to display user selection */}
      {(userHomeHexagon || userChoice) && (
        <div className={`px-4 py-3 ${userChoice ? 'bg-blue-700' : 'bg-green-700'} shadow-md`}>
          <div className="flex flex-wrap items-center justify-between">
            {userHomeHexagon && (
              <div className="flex items-center mr-6 mb-2 sm:mb-0">
                <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex items-baseline">
                  <span className="text-white font-medium mr-1">Your Region:</span>
                  <span className="text-white font-bold">{userHomeHexagon}</span>
                </div>
              </div>
            )}
            {userChoice && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex items-baseline">
                  <span className="text-white font-medium mr-1">Your Response:</span>
                  <span className="text-white font-bold">{userChoice}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className="flex-1 relative">
        <BaseMap
          viewBox={viewBox}
          scale={scale}
          translateX={translateX}
          translateY={translateY}
          setScale={setScale}
          setTranslateX={setTranslateX}
          setTranslateY={setTranslateY}
          title="Survey Map"
          subtitle="Click on a region to respond to the survey"
          geoJsonPath="/india-states.json"
        >
          <HexagonDrawing
            hexagons={hexagons}
            selectedHexagon={selectedHexagon}
            userHomeHexagon={userHomeHexagon}
            onHexagonClick={handleHexagonClick}
          />
        </BaseMap>

        {/* Zoom Controls */}
        <div className="absolute right-8 bottom-16 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          <button 
            className="p-2 hover:bg-gray-100 border-b border-gray-200"
            onClick={() => setScale(Math.min(scale + 0.2, 5))}
            aria-label="Zoom in"
          >
            <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-gray-100 border-b border-gray-200"
            onClick={() => setScale(Math.max(scale - 0.2, 0.5))}
            aria-label="Zoom out"
          >
            <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
          </button>
          <button 
            className="p-2 hover:bg-gray-100"
            onClick={() => {
              setScale(1);
              setTranslateX(0);
              setTranslateY(0);
            }}
            aria-label="Reset view"
          >
            <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Toggle Button for Survey Panel */}
        <button 
          className="absolute left-8 bottom-8 bg-green-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center hover:bg-green-700 transition-colors"
          onClick={togglePanelVisibility}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {isPanelVisible ? "Hide Survey" : "Take Survey"}
        </button>
        
        {/* Survey Panel */}
        {isPanelVisible && (
          <SurveyPanel
            selectedHexagon={selectedHexagon}
            onClose={togglePanelVisibility}
            onSubmit={handleUserSelection}
            currentSelection={userChoice}
          />
        )}
      </div>
    </div>
  );
};

export default SurveyMapPage;