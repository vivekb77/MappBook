// components/MapContainer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaMinus, FaSyncAlt, FaShareAlt } from 'react-icons/fa';
import Link from 'next/link';

// Import our custom components
import BaseMap from './BaseMap';
import HexagonDrawing from './HexagonOverlay';
import SetFandomPopup from './SetFandomPopup';

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

interface TeamColors {
  [key: string]: string;
}

const MapContainer: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON>(indiaStatesGeoJson as GeoJSON);
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(false);
  const [viewBox, setViewBox] = useState<ViewBox>({
    width: 900,
    height: 800,
    minLon: 68, // Use approximate India bounding box values
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // User ID state to identify specific browser/user
  const [userId, setUserId] = useState<string>("");

  // State for displaying selected hexagon and team at the top
  const [userHomeHexagon, setUserHomeHexagon] = useState<string | null>(null);
  const [userTeam, setUserTeam] = useState<string>("");

  // State for share URL notification
  const [showShareNotification, setShowShareNotification] = useState<boolean>(false);

  // Refs for drag and touch interactions - moved from BaseMap
  const mapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastX, setLastX] = useState<number>(0);
  const [lastY, setLastY] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  
  // New flag to track if user performed a zoom or multi-touch gesture
  const wasMultiTouchRef = useRef<boolean>(false);
  // Track the touch start time
  const touchStartTimeRef = useRef<number>(0);

  // Generate or retrieve a user ID on component mount
  useEffect(() => {
    const getOrCreateUserId = () => {
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('userId');

        if (storedId) {
          setUserId(storedId);
        } else {
          const newId = uuidv4();
          localStorage.setItem('userId', newId);
          setUserId(newId);
        }
      }
    };

    getOrCreateUserId();
  }, []);

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
      // Convert 120km to pixels based on map scale
      // For this, we need to know the real-world dimensions of India in the map

      // Approximate width of India in degrees of longitude (68°E to 97°E)
      const indiaLongSpan = viewBox.maxLon - viewBox.minLon; // in degrees
      // Approximate height of India in degrees of latitude (8°N to 37°N)
      const indiaLatSpan = viewBox.maxLat - viewBox.minLat; // in degrees

      // Approximate width of India (around 3,000 km)
      const indiaWidthKm = 3000;
      // Approximate height of India (around 3,200 km)
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
      // Fall back to empty array to prevent app crash
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
      return '0,0 0,0 0,0 0,0 0,0 0,0'; // Fallback to prevent render failures
    }
  };

  // Handle hexagon click
  const handleHexagonClick = (hexagon: Hexagon) => {
    // Only select a hexagon if we didn't just finish a multi-touch gesture
    if (!wasMultiTouchRef.current) {
      // Update the selectedHexagon state with the clicked hexagon
      setSelectedHexagon(hexagon);

      // Show the panel if it's not already visible
      if (!isPanelVisible) {
        setIsPanelVisible(true);
      }
    }
  };

  // Toggle panel visibility
  const togglePanelVisibility = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  // New callback for receiving team selection data
  const handleTeamSelection = (hexagon: string, team: string) => {
    setUserHomeHexagon(hexagon);
    setUserTeam(team);
  };

  // Function to copy share URL to clipboard
  const copyShareURL = () => {
    if (typeof window !== 'undefined') {
      // Create a URL with relevant parameters
      const baseURL = window.location.origin + window.location.pathname;
      const params = new URLSearchParams();

      if (userHomeHexagon) params.append('hexagon', userHomeHexagon);
      if (userTeam) params.append('team', userTeam);
      if (userId) params.append('id', userId);

      const shareURL = baseURL;

      // Copy to clipboard
      navigator.clipboard.writeText(shareURL)
        .then(() => {
          // Show notification
          setShowShareNotification(true);
          // Hide notification after 3 seconds
          setTimeout(() => {
            setShowShareNotification(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Error copying text: ', err);
          alert('Failed to copy URL to clipboard.');
        });
    }
  };

  // Calculate viewbox dimensions from GeoJSON data
  const calculateViewBox = (geoJson: GeoJSON): ViewBox => {
    try {
      // Start with reasonable defaults for India instead of Infinity
      let minLon = 68;  // Approximate western boundary of India
      let maxLon = 97;  // Approximate eastern boundary of India
      let minLat = 8;   // Approximate southern boundary of India
      let maxLat = 37;  // Approximate northern boundary of India

      // Only update if we find valid coordinates that are more extreme
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

      // Add some padding
      const lonPadding = (maxLon - minLon) * 0.05;
      const latPadding = (maxLat - minLat) * 0.05;

      // Calculate aspect ratio and adjust for screen size
      let mapWidth = 900;

      // Make the width responsive to screen size
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Adjust based on screen orientation and size
        if (screenWidth < 768) {
          mapWidth = screenWidth * 0.95;
        } else if (screenWidth < 1200) {
          mapWidth = screenWidth * 0.9;
        } else {
          mapWidth = Math.min(screenWidth * 0.85, 1400);
        }
      }

      // Calculate height based on the geographical aspect ratio
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

      // Fallback to default values if calculation fails
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

  // ===== EVENT HANDLERS MOVED FROM BASEMAP =====

  // Helper function to adjust sensitivity based on zoom level
  const getZoomAdaptiveSensitivity = (currentScale: number, isTouch: boolean = false): number => {
    // Base sensitivity higher for touch interactions
    const baseSensitivity = isTouch ? 1.2 : 1.0;

    // Scale sensitivity with zoom level
    if (currentScale > 2) {
      return baseSensitivity * 1.5;
    } else if (currentScale > 1) {
      return baseSensitivity * (1 + (currentScale - 1) * 0.5);
    }
    return baseSensitivity;
  };

  // Constrain translation to prevent map from going too far off-screen
  const constrainTranslation = (x: number, y: number): [number, number] => {
    // Calculate maximum pan distance based on current zoom and map dimensions
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
    if (e.button !== 0) return; // Only left mouse button

    isDraggingRef.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;

    // Get mouse sensitivity adjusted for current zoom level
    const adaptiveMouseSensitivity = getZoomAdaptiveSensitivity(scale);

    // Calculate new position with adaptive sensitivity
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

  // Modified touch handlers to track multi-touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    // Record the touch start time
    touchStartTimeRef.current = Date.now();
    
    // Reset multi-touch flag at the beginning of each touch sequence
    wasMultiTouchRef.current = false;
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastX(e.touches[0].clientX);
      setLastY(e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      // Mark this as a multi-touch interaction
      wasMultiTouchRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If we detect more than one touch at any point, mark it as multi-touch
    if (e.touches.length > 1) {
      wasMultiTouchRef.current = true;
    }
    
    if (!isDragging || e.touches.length !== 1) return;

    // Calculate movement deltas
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;

    // Get touch sensitivity adjusted for current zoom level
    const adaptiveTouchSensitivity = getZoomAdaptiveSensitivity(scale, true);

    // Calculate new position with adaptive sensitivity
    const newTranslateX = translateX + (dx / scale) * adaptiveTouchSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveTouchSensitivity;

    const [constrainedX, constrainedY] = constrainTranslation(newTranslateX, newTranslateY);

    // Cancel any existing animation frame
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Use requestAnimationFrame for smoother updates
    animationRef.current = requestAnimationFrame(() => {
      setTranslateX(constrainedX);
      setTranslateY(constrainedY);
      animationRef.current = null;
    });

    setLastX(e.touches[0].clientX);
    setLastY(e.touches[0].clientY);
  };

  // Modified touch zoom handler
  const handleTouchZoom = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    
    // Mark as multi-touch operation
    wasMultiTouchRef.current = true;

    // Get distance between two touches for pinch zoom
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    // If we don't have a previous distance yet, store this one
    if (lastTouchDistance === null) {
      setLastTouchDistance(currentDistance);
      return;
    }

    // Calculate zoom factor
    const factor = 0.01; // Adjust sensitivity here
    const delta = (currentDistance - lastTouchDistance) * factor;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));

    setScale(newScale);
    setLastTouchDistance(currentDistance);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    setLastTouchDistance(null);
    
    // Calculate touch duration
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    // For better UX, we'll keep the multi-touch flag active for a short period
    // This prevents accidental hexagon selection right after zooming
    if (wasMultiTouchRef.current) {
      // Keep the flag true, and reset it after a short delay
      setTimeout(() => {
        wasMultiTouchRef.current = false;
      }, 300); // 300ms should be enough to prevent accidental taps
    }
  };

  // Add event listeners for mouse events
  useEffect(() => {
    const mapElement = mapRef.current;
    if (mapElement) {
      // Add wheel event for zooming
      mapElement.addEventListener('wheel', handleWheel, { passive: false });

      // Add global mouse events for dragging
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Add touch-action: none to element style directly
      mapElement.style.touchAction = 'none';

      return () => {
        // Remove all listeners on cleanup
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

  // Zoom control functions
  const zoomIn = () => setScale(Math.min(scale + 0.2, 5));
  const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Get team color based on team name
  const getTeamColor = (teamName: string): string => {
    const teamColors: TeamColors = {
      'Chennai Super Kings': '#FFCC00',
      'Delhi Capitals': '#0052CC',
      'Gujarat Titans': '#1DA1F2',
      'Kolkata Knight Riders': '#6A0DAD',
      'Lucknow Super Giants': '#004D98',
      'Mumbai Indians': '#0078D7',
      'Punjab Kings': '#E60023',
      'Rajasthan Royals': '#FF1493',
      'Royal Challengers Bengaluru': '#1F1F1F',
      'Sunrisers Hyderabad': '#FF5700'
    };

    return teamColors[teamName] || '#1A5D1A'; // Default to cricket green if team not found
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
      {/* Header to display hexagon and team selection */}
      <div
        className="w-full shadow-md z-10"
        style={userTeam ? { backgroundColor: getTeamColor(userTeam) } : { backgroundColor: '#1A5D1A' }}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full px-3 py-2">
          <div className="flex items-center space-x-4">
            {userHomeHexagon && (
              <div className="flex items-center">
                <span className="text-white font-semibold text-xs md:text-sm mr-1">Your Region:</span>
                <span className="text-white text-sm md:text-base font-bold">{userHomeHexagon}</span>
              </div>
            )}
            {userTeam && (
              <div className="flex items-center">
                <span className="text-white font-semibold text-xs md:text-sm mr-1">Fan of:</span>
                <span className="text-white text-sm md:text-base font-bold">{userTeam}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyShareURL}
              className="bg-white text-green-800 hover:bg-gray-100 px-2 py-1 rounded shadow-sm border-none flex items-center font-semibold text-xs cursor-pointer"
              aria-label="Share URL"
            >
              <FaShareAlt className="mr-1 text-xs" />
              <span>Share</span>
            </button>

            <Link href="/ipl-fandom-map" passHref>
              <button
                className="bg-white text-green-800 hover:bg-gray-100 px-2 py-1 rounded shadow-sm border-none flex items-center font-semibold text-xs cursor-pointer"
                aria-label="See fandom map results"
              >
                <span>See Results</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full bg-white flex items-center justify-center">
        {/* Map container now has the ref and mouse events */}
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
            setScale={setScale}
            setTranslateX={setTranslateX}
            setTranslateY={setTranslateY}
          >
            <HexagonDrawing
              hexagons={hexagons}
              selectedHexagon={selectedHexagon}
              userHomeHexagon={userHomeHexagon}
              onHexagonClick={handleHexagonClick}
            />
          </BaseMap>
        </div>

        {/* Overlay Zoom Control Buttons */}
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

        {/* URL Share notification */}
        {showShareNotification && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-800 text-white px-4 py-2 rounded-lg shadow-lg z-20 transition-opacity duration-300">
            URL copied!
          </div>
        )}
      </div>

      {/* Hexagon Info Panel */}
      <SetFandomPopup
        selectedHexagon={selectedHexagon}
        isVisible={isPanelVisible}
        onToggleVisibility={togglePanelVisibility}
        userId={userId}
        onTeamSelect={handleTeamSelection}
      />

      {/* Toggle button for panel - fixed position at bottom-left */}
      <button
        className="fixed bottom-4 left-4 bg-green-800 px-3 py-2 md:px-4 md:py-2.5 rounded-lg z-10 shadow-md border-none flex items-center text-white font-semibold text-xs md:text-sm cursor-pointer"
        onClick={togglePanelVisibility}
        aria-label="Toggle team selection panel"
      >
        <span>
          {isPanelVisible ? "Hide Panel" : "Choose your Favourite IPL Team"}
        </span>
      </button>
    </div>
  );
};

export default MapContainer;