import React, { useEffect, useRef, useState, useContext } from "react";
import { Map, MapRef, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw } from "lucide-react";
import MapStatsOverlayPublic from "./MapStatsOverlayPublic";
import MarkAllPlacesPublic from "./MarkAllPlacesPublic";
import MapStyleSwitcher from "../Map/MapStyleSwitcher";
import { UserDataContext } from "../../app/map/[id]/page";

// Define the UserData type
interface UserData {
  id: string;
  clerk_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  map_views_left: number;
  total_map_views : number
}

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/newsexpressnz/cm2wvy2vv005c01q25cl3eo0w",
} as const;

type MapStyle = keyof typeof MAP_STYLES;

interface MapboxMapProps {
  className?: string;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -114.370789,
  latitude: 46.342303,
  zoom: 0.8,
  pitch: 25,
  bearing: 0,
  padding: {
    top: 0,      
    bottom: 200,  // Add bottom padding to account for the Create button
    left: 0,
    right: 0
  }
};

const ROTATION_VIEW_STATE = {
  pitch: 25,
  latitude: 35,
};

const SILICON_VALLEY_LONGITUDE = -100;
const ROTATION_DURATION = 25000;

const MapboxMapPublic: React.FC<MapboxMapProps> = ({
  className = "",
}) => {
  const userData = useContext(UserDataContext);
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(
    (userData?.map_style as MapStyle) || "satellite"
  );

  // Update map style when user data changes
  useEffect(() => {
    if (userData?.map_style && MAP_STYLES[userData.map_style as MapStyle]) {
      setCurrentMapStyle(userData.map_style as MapStyle);
      const map = mapRef.current?.getMap();
      if (map) {
        map.setStyle(MAP_STYLES[userData.map_style as MapStyle]);
      }
    }
  }, [userData?.map_style]);

  // Globe rotation animation
  useEffect(() => {
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = (timestamp - startTimeRef.current) / ROTATION_DURATION;

      if (isRotating) {
        setViewState(prev => ({
          ...prev,
          ...ROTATION_VIEW_STATE,
          longitude: SILICON_VALLEY_LONGITUDE + (progress * 360) % 360,
        }));
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isRotating) {
      startTimeRef.current = null;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRotating]);

  const startRotation = () => {
    setIsRotating(true);
    if (mapRef.current) {
      mapRef.current.flyTo({
        ...ROTATION_VIEW_STATE,
        duration: 2000,
        essential: true,
      });
    }
  };

  const handleMapLoad = () => {
    setIsLoading(false);
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (map) {
      map.setFog({
        'horizon-blend': 0.2,
        'color': '#ffffff',
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.6
      });
    }
  };

  const handleMapError = (error: { error: Error }) => {
    setError("Unable to load map. Please try again later.");
    setIsLoading(false);
    setIsRotating(false);
    setMapLoaded(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMapInteraction = () => {
    if (isRotating) {
      setIsRotating(false);
    }
  };

  const handleViewStateChange = ({ viewState }: { viewState: ViewState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = viewState;
    setViewState({ longitude, latitude, zoom, pitch, bearing });
  };

  const handleStyleChange = (newStyle: MapStyle) => {
    setCurrentMapStyle(newStyle);
    const map = mapRef.current?.getMap();
    if (map) {
      map.setStyle(MAP_STYLES[newStyle]);
    }
  };

  if (error) {
    return (
      <div className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Alert variant="destructive" className="w-96">
            <AlertDescription>Unable to load map. Please try again later.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Don't render anything if there's no user data
  if (!userData) {
    return null;
  }

  return (
    <div className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

<Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        initialViewState={DEFAULT_VIEW_STATE}
        {...viewState}
        onMove={handleViewStateChange}
        onClick={handleMapInteraction}
        onDrag={handleMapInteraction}
        onWheel={handleMapInteraction}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapStyle={MAP_STYLES[currentMapStyle]}
        reuseMaps
        attributionControl={false}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        // style={{ width: '100%', height: 'calc(100% + 100px)', marginTop: '-50px' }}  // Adjust height and margin to center
      >
        {mapLoaded && (
          <>
            <MarkAllPlacesPublic userData={userData} />
            <MapStatsOverlayPublic userData={userData} />
            <MapStyleSwitcher
              currentStyle={currentMapStyle}
              onStyleChange={handleStyleChange}
            />
          </>
        )}
      </Map>

      {!isRotating && !error && (
       <button
       onClick={startRotation}
       className="absolute bottom-4 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-50"
       title="Resume rotation"
       type="button"
     >
       <RotateCcw className="w-5 h-5 text-gray-700" />
     </button>
      )}
    </div>
  );
};

export default React.memo(MapboxMapPublic);