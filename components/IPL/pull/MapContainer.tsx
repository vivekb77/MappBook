"use client"
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FaShareAlt, FaFilter } from 'react-icons/fa';
import TeamDistributionModal from './GlobalPopup';
import FilterByTeams from './FilterByTeam';
import { Instagram, Twitter, Share2, MessageCircle } from 'lucide-react';
import ShareComponent from './ShareComponent';
import { useTeam } from '../../IPL/TeamContext';

// Dynamically import the HexagonPopup component to prevent SSR issues
const HexagonPopup = dynamic(() => import('./HexagonPopup'), {
  ssr: false,
});

const todaysMatchTeams = {
  team1: 'Mumbai Indians',
  team2: 'Royal Challengers Bengaluru',
  team3: 'Chennai Super Kings'
};

// Chennai Super Kings
// Gujarat Titans
// Kolkata Knight Riders
// Punjab Kings
// Rajasthan Royals
// Royal Challengers Bengaluru
// Sunrisers Hyderabad
// Lucknow Super Giants
// Mumbai Indians
// Delhi Capitals   

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
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<HexagonData | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showShareNotification, setShowShareNotification] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);
  const { selectedTeam, isTeamSelected } = useTeam();

  // Team colors for the IPL teams
  const teamColors = {
    'Chennai Super Kings': '#FFDC00',     // Yellow
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Kolkata Knight Riders': '#552583',   // Purple
    'Punjab Kings': '#ED1B24',            // Red
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Sunrisers Hyderabad': '#FF6500',     // Orange,
    'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
    'Mumbai Indians': '#00305a',         // Deep blue with light blue accent
    'Delhi Capitals': '#0033A0',         // Red with navy blue accent
  };

  // Pan constraints
  const MAX_PAN_X = 500;
  const MAX_PAN_Y = 500;

  const [viewBox, setViewBox] = useState<ViewBoxType>({
    width: 900,
    height: 800,
    minLon: 68, // Use approximate India bounding box values
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // Calculate sensitivity based on current zoom level
  const getZoomAdaptiveSensitivity = (currentScale: number, isTouch: boolean = false) => {
    // Base sensitivity values
    const baseSensitivity = isTouch ? 2.0 : 1.5;

    // Higher zoom levels (scale > 1) need increased sensitivity
    if (currentScale > 1) {
      // This progressively increases sensitivity as zoom increases
      // At scale 5, sensitivity will be ~7.5x higher than at scale 1
      return baseSensitivity * (1 + (currentScale - 1) * 1.5);
    }

    return baseSensitivity;
  };

  // Optimized pan constraints that adjust based on zoom level
  const constrainTranslation = (x: number, y: number): [number, number] => {
    // Allow greater panning range at higher zoom levels
    const adjustedMaxPanX = MAX_PAN_X * Math.max(1, scale);
    const adjustedMaxPanY = MAX_PAN_Y * Math.max(1, scale);

    return [
      Math.max(-adjustedMaxPanX, Math.min(adjustedMaxPanX, x)),
      Math.max(-adjustedMaxPanY, Math.min(adjustedMaxPanY, y))
    ];
  };

  // Enhanced mouse movement handler with adaptive sensitivity
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection during drag
    setIsDragging(true);
    setLastX(e.clientX);
    setLastY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    // Calculate movement deltas
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    // Get sensitivity adjusted for current zoom level
    const adaptiveSensitivity = getZoomAdaptiveSensitivity(scale);

    // Calculate new position with adaptive sensitivity
    const newTranslateX = translateX + (dx / scale) * adaptiveSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveSensitivity;

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

    setLastX(e.clientX);
    setLastY(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Enhanced touch movement handler with adaptive sensitivity
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastX(e.touches[0].clientX);
      setLastY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
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

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Simple zooming function that applies zoom uniformly
  const handleZoom = (delta: number) => {
    // Calculate new scale with constraints
    const newScale = Math.max(0.5, Math.min(5, scale + delta));

    // Update scale without changing the center point
    setScale(newScale);
  };

  // Simplified wheel event handler
  const handleWheelEvent = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  // Simplified pinch to zoom handler
  const [lastDistance, setLastDistance] = useState<number | null>(null);

  const handleTouchZoom = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calculate the distance between two fingers
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // If we have a previous distance, calculate the zoom
      if (lastDistance !== null) {
        const delta = (distance - lastDistance) * 0.01;
        handleZoom(delta);
      }

      setLastDistance(distance);
    } else {
      setLastDistance(null);
    }
  };

  // Handle team selection
  const handleTeamSelect = (team: string) => {
    setSelectedTeams(prev => {
      // If already selected, remove it
      if (prev.includes(team)) {
        return prev.filter(t => t !== team);
      }

      // No limit on team selection - just add it
      return [...prev, team];
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedTeams([]);
  };

  // Function to copy current URL to clipboard
  const copyShareURL = () => {
    if (typeof window !== 'undefined') {
      // Create a URL with relevant parameters
      const baseURL = window.location.origin + window.location.pathname;

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

  // Calculate viewbox once we have the map data
  useEffect(() => {
    if (geoJsonData) {
      const calculatedViewBox = calculateViewBox(geoJsonData);
      setViewBox(calculatedViewBox);
    }
  }, [geoJsonData]);

  // Add non-passive wheel event listener to fix preventDefault issue
  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    mapContainer.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      mapContainer.removeEventListener('wheel', handleWheelEvent);
    };
  }, [scale, translateX, translateY]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  // Handle hexagon click
  const handleHexagonClick = (hexagon: Hexagon, hexagonData: HexagonData) => {
    setSelectedHexagon(hexagon);
    setPopupData(hexagonData);
    setShowPopup(true);
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // Optimization: Memoize SVG transform to reduce calculations
  const svgTransform = `translate(${viewBox.width / 2 + translateX}, ${viewBox.height / 2 + translateY}) scale(${scale}) translate(${-viewBox.width / 2}, ${-viewBox.height / 2})`;

  return (
    <div className="relative flex flex-col h-screen-dynamic w-full bg-gray-100 overflow-hidden">
      {/* Metadata Display */}
      <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow mx-2 mt-2 mb-2">
        <div className="flex items-center">
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
          <span>Leaderboard!!</span>
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden touch-none relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handleTouchZoom(e);
        }}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          style={{ background: "#f5f5f5" }}
        >
          <g transform={svgTransform}>
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
              selectedTeams={selectedTeams}
            />
          </g>

          {/* Render popup outside of the transform group */}
          {showPopup && popupData && (
            <HexagonPopup
              popupData={popupData}
              position={{ x: 0, y: 0 }}
              viewBox={{
                width: viewBox.width,
                height: viewBox.height
              }}
              onClose={closePopup}
              teamColors={teamColors}
            />
          )}
        </svg>
      </div>

      {/* Bottom Right Control Group */}
      <div className="fixed right-2 bottom-2 flex flex-col gap-2 items-end">
        {/* Filter Button - Top */}
        {/* Filter Button */}
        <div className="bg-green-700 rounded-full shadow-md">
          <button
            className="w-12 h-12 flex items-center justify-center hover:bg-green-800 rounded-full transition-colors"
            onClick={() => setShowTeamFilter(true)}
            aria-label="Filter teams"
          >
            <FaFilter className="text-white" />
          </button>
        </div>

        {/* Zoom Control Buttons - Middle */}
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          <button
            className="w-10 h-10 flex items-center justify-center border-b border-gray-200 hover:bg-gray-100"
            onClick={() => handleZoom(0.2)}
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center border-b border-gray-200 hover:bg-gray-100"
            onClick={() => handleZoom(-0.2)}
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

        {/* Social Media Buttons - Bottom */}
        <div className="flex gap-2">
          <Link href="https://x.com/mappbook" passHref>
            <button
              className="bg-white text-green-800 hover:bg-gray-100 p-2 rounded-lg shadow-sm border-none flex items-center justify-center cursor-pointer"
              aria-label="follow us on X"
              onClick={(e) => {
                e.preventDefault();
                window.open("https://x.com/mappbook", "_blank");
              }}
            >
              <Twitter size={20} />
            </button>
          </Link>
        </div>
      </div>

      {/* Bottom Left Control Group - Vertically stacked */}
      <div className="fixed bottom-2 left-2 flex flex-col gap-2 w-auto max-w-[320px] sm:max-w-[300px]">
        {/* Today's Match Support Button */}
        <button
          onClick={() => {
            // Set selected teams to today's match teams
            setSelectedTeams([todaysMatchTeams.team1, todaysMatchTeams.team2, todaysMatchTeams.team3]);
            // Open the filter modal to show the selection
            setShowTeamFilter(true);
          }}
          className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-lg shadow-sm border-none flex items-center justify-center font-semibold text-sm cursor-pointer w-full"
          aria-label="Filter for today's match"
        >
          <span>Filter by Top Teams</span>
        </button>

        {/* Choose IPL Team Button */}
        <Link href="/" passHref>
          <button
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-lg shadow-sm border-none flex items-center justify-center font-semibold text-sm cursor-pointer w-full"
            aria-label="See fandom map results"
          >
            <span>Choose your favourite IPL team</span>
          </button>
        </Link>

        <ShareComponent 
          customUrl="https://mappbook.com"
          onShareClick={() => {
            // You can trigger analytics or other events when sharing
            // console.log("User shared");
          }} 
        />
      </div>


      {/* URL Share notification */}
      {showShareNotification && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-800 text-white px-4 py-2 rounded-lg shadow-lg z-20 transition-opacity duration-300">
          Link to share copied!
        </div>
      )}

      {/* Team Distribution Modal Component */}
      <TeamDistributionModal
        showModal={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        mapData={mapData}
      />

      {/* Team Filter Modal Component */}
      <FilterByTeams
        showModal={showTeamFilter}
        onClose={() => setShowTeamFilter(false)}
        selectedTeams={selectedTeams}
        onSelectTeam={handleTeamSelect}
        onResetFilters={resetFilters}
      />
    </div>
  );
}

export default MapContainer;