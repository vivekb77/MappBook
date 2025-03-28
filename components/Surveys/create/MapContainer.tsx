"use client"
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Types
interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
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

interface ViewBoxType {
  width: number;
  height: number;
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

interface TeamDistribution {
  team: string;
  count: number;
  percentage: number;
}

interface MapData {
  success: boolean;
  data: {
    hexagons: any[];
    metadata: {
      total_fans: number;
      updated_at: string;
      total_hexagons: number;
    };
    global_team_distribution: TeamDistribution[];
  };
  timestamp: string;
}

// Dynamically import SVG components to prevent SSR issues
const BaseMapWithNoSSR = dynamic(() => import('./BaseMap'), {
  ssr: false,
});

const HexagonOverlayWithNoSSR = dynamic(() => import('./HexagonOverlay'), {
  ssr: false,
});

interface MapContainerProps {
  geoJsonData: GeoJSON;
}

const MapContainer: React.FC<MapContainerProps> = ({ geoJsonData }) => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState<ViewBoxType>({
    width: 900,
    height: 800,
    minLon: 68, // Use approximate India bounding box values
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // Calculate viewbox once we have the map data
  useEffect(() => {
    if (geoJsonData) {
      const calculatedViewBox = calculateViewBox(geoJsonData);
      setViewBox(calculatedViewBox);
    }
  }, [geoJsonData]);

  // Handle map data received from hexagon overlay
  const handleDataFetched = (data: MapData) => {
    setMapData(data);
  };

  // Calculate viewbox dimensions from GeoJSON data
  const calculateViewBox = (geoJson: GeoJSON): ViewBoxType => {
    try {
      // Start with reasonable defaults for India instead of Infinity
      let minLon = 68;  // Approximate western boundary of India
      let maxLon = 97;  // Approximate eastern boundary of India
      let minLat = 8;   // Approximate southern boundary of India
      let maxLat = 37;  // Approximate northern boundary of India

      // Only update if we find valid coordinates that are more extreme
      geoJson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((point: any) => {
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
            polygon[0].forEach((point: any) => {
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

  // Map interaction handlers for web
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastX(e.clientX);
    setLastY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      setTranslateX(translateX + dx / scale);
      setTranslateY(translateY + dy / scale);

      setLastX(e.clientX);
      setLastY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    setScale(newScale);
  };

  // Handle hexagon click
  const handleHexagonClick = (hexagon: Hexagon) => {
    setSelectedHexagon(hexagon);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Metadata Display */}
      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow mx-4 mt-4 mb-2">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {mapData && (
            <span className="text-gray-700">
              Total Fans: <span className="font-bold text-green-700">{mapData.data.metadata.total_fans.toLocaleString()}</span>
            </span>
          )}
        </div>
        <button 
          className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-800 transition-colors"
          onClick={() => setShowDistributionModal(true)}
        >
          <span>IPL Team Fandom</span>
        </button>
      </div>

      {/* Map Container */}
      <div 
        className="flex-1 bg-white mx-4 mb-4 rounded-lg shadow-md overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="touch-none"
        >
          <g transform={`translate(${viewBox.width / 2 + translateX}, ${viewBox.height / 2 + translateY}) scale(${scale}) translate(${-viewBox.width / 2}, ${-viewBox.height / 2})`}>
            {/* India Base Map Component */}
            <BaseMapWithNoSSR
              geoJsonData={geoJsonData}
              viewBox={viewBox}
            />

            {/* Hexagon Overlay Component */}
            <HexagonOverlayWithNoSSR
              geoJsonData={geoJsonData}
              viewBox={viewBox}
              selectedHexagon={selectedHexagon}
              onHexagonClick={handleHexagonClick}
              onDataFetched={handleDataFetched}
            />
          </g>
        </svg>
      </div>

      {/* Zoom Control Buttons */}
      <div className="fixed right-6 bottom-6 bg-white rounded-lg overflow-hidden shadow-md">
        <button 
          className="w-10 h-10 flex items-center justify-center border-b border-gray-200 hover:bg-gray-100"
          onClick={() => setScale(Math.min(scale + 0.2, 5))}
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          className="w-10 h-10 flex items-center justify-center border-b border-gray-200 hover:bg-gray-100"
          onClick={() => setScale(Math.max(scale - 0.2, 0.5))}
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button 
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
          onClick={() => {
            setScale(1);
            setTranslateX(0);
            setTranslateY(0);
          }}
          aria-label="Reset view"
        >
          <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Team Distribution Modal */}
      {showDistributionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">IPL Team Fandom Distribution</h2>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowDistributionModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {mapData ? (
                <div>
                  <h3 className="text-center text-xl font-bold mb-4">Who fans support in IPL 2025</h3>
                  <div className="space-y-3">
                    {mapData.data.global_team_distribution.map((item, index) => {
                      const teamColors: { [key: string]: string } = {
                        'Chennai Super Kings': '#FFDC00',
                        'Delhi Capitals': '#0033A0',
                        'Gujarat Titans': '#39B6FF',
                        'Kolkata Knight Riders': '#552583',
                        'Lucknow Super Giants': '#005CB9',
                        'Mumbai Indians': '#004C93',
                        'Punjab Kings': '#ED1B24',
                        'Rajasthan Royals': '#FF69B4',
                        'Royal Challengers Bengaluru': '#2B2A29',
                        'Sunrisers Hyderabad': '#FF6500'
                      };
                      const color = teamColors[item.team] || '#cccccc';
                      const maxCount = Math.max(...mapData.data.global_team_distribution.map(i => i.count));
                      const barWidth = (item.count / maxCount) * 100;
                      
                      return (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-700">{item.team}</span>
                            <span className="text-gray-700">
                              {item.count.toLocaleString()} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${barWidth}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;