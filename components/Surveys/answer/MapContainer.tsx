// components/MapContainer.js
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaMinus, FaSyncAlt } from 'react-icons/fa';

// Import our custom components
import BaseMap from './BaseMap';
import HexagonDrawing from './HexagonDrawing';
import SetFandomPopup from './SetFandomPopup';

// Import GeoJSON directly
import indiaStatesGeoJson from '../../../public/india-states.json';

const MapContainer = () => {
  const [geoJsonData, setGeoJsonData] = useState(indiaStatesGeoJson);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [hexagons, setHexagons] = useState([]);
  const [selectedHexagon, setSelectedHexagon] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [viewBox, setViewBox] = useState({ 
    width: 900, 
    height: 800, 
    minLon: 68, // Use approximate India bounding box values
    maxLon: 97, 
    minLat: 8, 
    maxLat: 37 
  });

  // User ID state to identify specific browser/user
  const [userId, setUserId] = useState("");

  // State for displaying selected hexagon and team at the top
  const [userHomeHexagon, setUserHomeHexagon] = useState(null);
  const [userTeam, setUserTeam] = useState("");

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

  // No need to fetch GeoJSON data as we're importing it directly
  // This effect is just here in case you want to add additional data loading in the future
  useEffect(() => {
    // We could add additional data loading here if needed
    // For now, we're just using the directly imported GeoJSON
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
  const generateHexagonsFromData = (viewBox) => {
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
      const hexSidePixels = 100 * ((pixelsPerKmLong + pixelsPerKmLat) / 2);
      
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
      
      const hexList = [];
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
  const isPointInsideIndia = (lon, lat, geoJson) => {
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
  const isPointInPolygon = (lon, lat, polygon) => {
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
  const calculateHexagonPoints = (centerX, centerY, radius) => {
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

  // Handle hexagon click
  const handleHexagonClick = (hexagon) => {
    // Update the selectedHexagon state with the clicked hexagon
    setSelectedHexagon(hexagon);
    
    // Show the panel if it's not already visible
    if (!isPanelVisible) {
      setIsPanelVisible(true);
    }
  };

  // Toggle panel visibility
  const togglePanelVisibility = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  // New callback for receiving team selection data
  const handleTeamSelection = (hexagon, team) => {
    setUserHomeHexagon(hexagon);
    setUserTeam(team);
  };

  // Calculate viewbox dimensions from GeoJSON data
  const calculateViewBox = (geoJson) => {
    try {
      // Start with reasonable defaults for India instead of Infinity
      let minLon = 68;  // Approximate western boundary of India
      let maxLon = 97;  // Approximate eastern boundary of India
      let minLat = 8;   // Approximate southern boundary of India
      let maxLat = 37;  // Approximate northern boundary of India
      
      // Only update if we find valid coordinates that are more extreme
      geoJson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach(point => {
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
            polygon[0].forEach(point => {
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

  // Zoom control functions
  const zoomIn = () => setScale(Math.min(scale + 0.2, 5));
  const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Get team color based on team name
  const getTeamColor = (teamName) => {
    const teamColors = {
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
      <div className="errorContainer">
        <p className="errorText">Loading map data...</p>
        <div className="loadingSpinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* New header to display hexagon and team selection */}
      {(userHomeHexagon || userTeam) && (
        <div 
          className="headerBanner"
          style={userTeam ? {backgroundColor: getTeamColor(userTeam)} : null}
        >
          <div className="headerContent">
            {userHomeHexagon && (
              <div className="headerItem">
                <span className="headerLabel">Your Region:</span>
                <span className="headerValue">{userHomeHexagon}</span>
              </div>
            )}
            {userTeam && (
              <div className="headerItem">
                <span className="headerLabel">Fan of:</span>
                <span className="headerValue">{userTeam}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mapContainer">
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

      {/* Zoom Control Buttons */}
      <div className="zoomControls">
        <button 
          className="zoomButton"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          <FaPlus />
        </button>
        <button 
          className="zoomButton"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          <FaMinus />
        </button>
        <button 
          className="zoomButton"
          onClick={resetView}
          aria-label="Reset view"
        >
          <FaSyncAlt />
        </button>
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
        className="toggleButton"
        onClick={togglePanelVisibility}
        aria-label="Toggle team selection panel"
      >
        <FaSyncAlt className="buttonIcon" />
        <span>
          {isPanelVisible ? "Hide Panel" : "Set Favourite IPL Team"}
        </span>
      </button>

      <style jsx>{`
        .container {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #F5F5F5;
        }
        .mapContainer {
          flex: 1;
          margin: 10px;
          border-radius: 10px;
          overflow: hidden;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .errorContainer {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          height: 100vh;
          background-color: #F5F5F5;
        }
        .errorText {
          font-size: 18px;
          color: #1A5D1A;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .loadingSpinner {
          border: 4px solid rgba(26, 93, 26, 0.3);
          border-radius: 50%;
          border-top: 4px solid #1A5D1A;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .headerBanner {
          background-color: #1A5D1A;
          padding: 12px 15px;
          width: 100%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }
        .headerContent {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        .headerItem {
          display: flex;
          align-items: center;
          margin-right: 20px;
          margin-bottom: 5px;
          margin-top: 5px;
        }
        .headerLabel {
          color: white;
          font-weight: 600;
          font-size: 14px;
          margin-right: 5px;
        }
        .headerValue {
          color: white;
          font-size: 16px;
          font-weight: bold;
        }
        .toggleButton {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background-color: #1A5D1A;
          padding: 10px 15px;
          border-radius: 8px;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
          display: flex;
          align-items: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .buttonIcon {
          margin-right: 8px;
        }
        .zoomControls {
          position: fixed;
          right: 20px;
          bottom: 20px;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        .zoomButton {
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          background-color: white;
          color: #1A5D1A;
          cursor: pointer;
          font-size: 16px;
          border-bottom: 1px solid #eee;
        }
        .zoomButton:last-child {
          border-bottom: none;
        }
        .zoomButton:hover {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default MapContainer;