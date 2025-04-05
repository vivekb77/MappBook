// components/MapContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaMinus, FaSyncAlt } from 'react-icons/fa';

// Import our custom components
import BaseMap from './BaseMap';
import HexagonOverlay from './HexagonOverlay';

// Import GeoJSON directly
import indiaStatesGeoJson from '../../../public/india-states.json';

// TypeScript interfaces
interface ViewBox {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

interface Feature {
  geometry: {
    type: string;
    coordinates: any[];
  };
  properties: Record<string, any>;
}

interface GeoJSON {
  type: string;
  features: Feature[];
}

const MapContainer: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON>(indiaStatesGeoJson as GeoJSON);
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({
    width: 900,
    height: 800,
    minLon: 68,
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // Refs for drag and touch interactions
  const mapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastX, setLastX] = useState<number>(0);
  const [lastY, setLastY] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  
  // New flag to track multi-touch gestures
  const wasMultiTouchRef = useRef<boolean>(false);
  const touchStartTimeRef = useRef<number>(0);

  // Calculate viewbox and generate hexagons once we have the map data
  useEffect(() => {
    if (geoJsonData) {
      const calculatedViewBox = calculateViewBox(geoJsonData);
      setViewBox(calculatedViewBox);
      generateHexagonsFromData(calculatedViewBox);
    }
  }, [geoJsonData]);

  // Generate hexagons dynamically across the India map
  const generateHexagonsFromData = (viewBox: ViewBox) => {
    try {
      // Approximate width of India in degrees of longitude (68°E to 97°E)
      const indiaLongSpan = viewBox.maxLon - viewBox.minLon;
      // Approximate height of India in degrees of latitude (8°N to 37°N)
      const indiaLatSpan = viewBox.maxLat - viewBox.minLat;

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
      const cols = Math.ceil(viewBox.width / horizontalSpacing) + 2;
      const rows = Math.ceil(viewBox.height / verticalSpacing) + 2;

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
      return '0,0 0,0 0,0 0,0 0,0 0,0';
    }
  };

  // Handle hexagon click
  const handleHexagonClick = (hexagon: Hexagon) => {
    if (!wasMultiTouchRef.current) {
      setSelectedHexagon(hexagon);
    }
  };

  // Helper function to adjust sensitivity based on zoom level
  const getZoomAdaptiveSensitivity = (currentScale: number, isTouch: boolean = false): number => {
    const baseSensitivity = isTouch ? 1.2 : 1.0;

    if (currentScale > 2) {
      return baseSensitivity * 1.5;
    } else if (currentScale > 1) {
      return baseSensitivity * (1 + (currentScale - 1) * 0.5);
    }
    return baseSensitivity;
  };

  // Constrain translation to prevent map from going too far off-screen
  const constrainTranslation = (x: number, y: number): [number, number] => {
    const maxPanDistance = Math.max(viewBox.width, viewBox.height) * 0.7 * scale;

    return [
      Math.max(Math.min(x, maxPanDistance), -maxPanDistance),
      Math.max(Math.min(y, maxPanDistance), -maxPanDistance)
    ];
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY * -0.01;
    const newScale = Math.max(0.5, Math.min(5, scale + scaleChange));
    setScale(newScale);
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    isDraggingRef.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;

    const adaptiveMouseSensitivity = getZoomAdaptiveSensitivity(scale);

    const newTranslateX = translateX + (dx / scale) * adaptiveMouseSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveMouseSensitivity;

    const [constrainedX, constrainedY] = constrainTranslation(newTranslateX, newTranslateY);

    setTranslateX(constrainedX);
    setTranslateY(constrainedY);

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTimeRef.current = Date.now();
    wasMultiTouchRef.current = false;
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastX(e.touches[0].clientX);
      setLastY(e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      wasMultiTouchRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      wasMultiTouchRef.current = true;
    }
    
    if (!isDragging || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;

    const adaptiveTouchSensitivity = getZoomAdaptiveSensitivity(scale, true);

    const newTranslateX = translateX + (dx / scale) * adaptiveTouchSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveTouchSensitivity;

    const [constrainedX, constrainedY] = constrainTranslation(newTranslateX, newTranslateY);

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(() => {
      setTranslateX(constrainedX);
      setTranslateY(constrainedY);
      animationRef.current = null;
    });

    setLastX(e.touches[0].clientX);
    setLastY(e.touches[0].clientY);
  };

  const handleTouchZoom = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    
    wasMultiTouchRef.current = true;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    if (lastTouchDistance === null) {
      setLastTouchDistance(currentDistance);
      return;
    }

    const factor = 0.01;
    const delta = (currentDistance - lastTouchDistance) * factor;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));

    setScale(newScale);
    setLastTouchDistance(currentDistance);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    setLastTouchDistance(null);
    
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    if (wasMultiTouchRef.current) {
      setTimeout(() => {
        wasMultiTouchRef.current = false;
      }, 300);
    }
  };

  // Add event listeners for mouse events
  useEffect(() => {
    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      mapElement.style.touchAction = 'none';

      return () => {
        mapElement.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [scale, translateX, translateY]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (geoJsonData) {
        const recalculatedViewBox = calculateViewBox(geoJsonData);
        setViewBox(recalculatedViewBox);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [geoJsonData]);

  // Calculate viewbox dimensions from GeoJSON data
  const calculateViewBox = (geoJson: GeoJSON): ViewBox => {
    try {
      let minLon = 68;  // Approximate western boundary of India
      let maxLon = 97;  // Approximate eastern boundary of India
      let minLat = 8;   // Approximate southern boundary of India
      let maxLat = 37;  // Approximate northern boundary of India

      geoJson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((point: string | any[]) => {
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
            polygon[0].forEach((point: string | any[]) => {
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

      const lonPadding = (maxLon - minLon) * 0.05;
      const latPadding = (maxLat - minLat) * 0.05;

      let mapWidth = 900;

      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) {
          mapWidth = screenWidth * 0.95;
        } else if (screenWidth < 1200) {
          mapWidth = screenWidth * 0.9;
        } else {
          mapWidth = Math.min(screenWidth * 0.85, 1400);
        }
      }

      const geoAspectRatio = (maxLat - minLat) / (maxLon - minLon);
      const mapHeight = mapWidth * geoAspectRatio;

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

  // Zoom control functions
  const zoomIn = () => setScale(Math.min(scale + 0.2, 5));
  const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  if (!geoJsonData) {
    return (
      <div className="flex flex-col justify-center items-center p-5 h-screen bg-gray-100">
        <p className="text-lg text-green-800 text-center mb-5 font-medium">Loading map data...</p>
        <div className="w-10 h-10 border-4 border-green-800 border-t-green-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen-dynamic w-full bg-gray-100 overflow-hidden">
      <div className="flex-1 relative w-full h-full bg-white flex items-center justify-center">
        {/* Map container */}
        <div
          ref={mapRef}
          className="flex-1 h-full mx-2.5 mb-2.5 rounded-lg overflow-hidden bg-white shadow-md cursor-grab relative select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => {
            handleTouchMove(e);
            handleTouchZoom(e);
          }}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <BaseMap
            geoJsonData={geoJsonData}
            viewBox={viewBox}
            scale={scale}
            translateX={translateX}
            translateY={translateY}
          >
            <HexagonOverlay
              hexagons={hexagons}
              selectedHexagon={selectedHexagon}
              userHomeHexagon={null}
              onHexagonClick={handleHexagonClick}
            />
          </BaseMap>
        </div>

        {/* Zoom Control Buttons */}
        <div className="absolute right-2 bottom-10 bg-white bg-opacity-90 rounded-lg overflow-hidden shadow-md z-10">
          <button
            className="w-10 h-10 md:w-10 md:h-10 flex justify-center items-center border-none bg-transparent text-green-800 cursor-pointer text-base border-b border-gray-200 hover:bg-gray-100"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <FaPlus />
          </button>
          <button
            className="w-10 h-10 md:w-10 md:h-10 flex justify-center items-center border-none bg-transparent text-green-800 cursor-pointer text-base border-b border-gray-200 hover:bg-gray-100"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <FaMinus />
          </button>
          <button
            className="w-10 h-10 md:w-10 md:h-10 flex justify-center items-center border-none bg-transparent text-green-800 cursor-pointer text-base hover:bg-gray-100"
            onClick={resetView}
            aria-label="Reset view"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;