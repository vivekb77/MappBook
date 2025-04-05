import React, { useState, useEffect } from 'react';
import DrawMap from './DrawMap';
import DrawHexagon from './DrawHexagon';
import MapInteraction from './MapInteraction';
import PollHeader from '../Poll/PollDetails/PollHeader';
import { ViewBox, GeoJSON, Hexagon, calculateViewBox } from './utils/MapLogic';
import { generateHexagons } from './utils/HexagonLogic';

// Import GeoJSON directly (adjust the path as needed)
import indiaStatesGeoJson from '../../../public/india-states.json';

interface PollData {
  poll_id: string;
  poll_id_to_share: string;
  title: string;
  description: string;
  author: string;
  pollLength: string;
  questions: any[];
  created_at: string;
  expires_at: string;
  is_active: boolean;
  isExpired: boolean;
}

interface ContainerProps {
  pollData: PollData;
}

const Container: React.FC<ContainerProps> = ({ pollData }) => {
  // Core map state
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON>(indiaStatesGeoJson as GeoJSON);
  const [viewBox, setViewBox] = useState<ViewBox>({
    width: 900,
    height: 800,
    minLon: 68,
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // View transformation state
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);

  // Hexagon state
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);

  // Initialize viewbox and hexagons when geoJSON data is available
  useEffect(() => {
    if (geoJsonData) {
      const calculatedViewBox = calculateViewBox(geoJsonData);
      setViewBox(calculatedViewBox);
      
      // Generate hexagons based on the calculated viewbox
      const generatedHexagons = generateHexagons(calculatedViewBox, geoJsonData);
      setHexagons(generatedHexagons);
    }
  }, [geoJsonData]);

  // Handler for updating both translation coordinates
  const handleTranslateChange = (x: number, y: number) => {
    setTranslateX(x);
    setTranslateY(y);
  };

  // Reset the view to initial state
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Handle hexagon selection
  const handleHexagonClick = (hexagon: Hexagon) => {
    setSelectedHexagon(hexagon);
  };

  // Handle window resize
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

  // Loading state
  if (!geoJsonData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-green-800">Loading map data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-4">
      {/* Logo */}
      <div className="relative group mb-4 self-start">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
        <div className="relative px-5 py-2 rounded-lg bg-white flex items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">Mapp</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Book</span>
          </h1>
        </div>
      </div>
      
      {/* Poll Header */}
      <PollHeader 
        title={pollData.title}
        author={pollData.author}
        description={pollData.description}
        expiresAt={pollData.expires_at}
        isActive={pollData.is_active}
        isExpired={pollData.isExpired}
      />
      
      {/* Map Container */}
      <div className="flex-grow">
        <MapInteraction
          scale={scale}
          translateX={translateX}
          translateY={translateY}
          onScaleChange={setScale}
          onTranslateChange={handleTranslateChange}
          onResetView={resetView}
        >
          <DrawMap
            geoJsonData={geoJsonData}
            viewBox={viewBox}
            scale={scale}
            translateX={translateX}
            translateY={translateY}
          >
            <DrawHexagon
              hexagons={hexagons}
              selectedHexagon={selectedHexagon}
              userHomeHexagon={null}
              onHexagonClick={handleHexagonClick}
            />
          </DrawMap>
        </MapInteraction>
      </div>
    </div>
  );
};

export default Container;