import React, { useEffect, useRef, useState, useContext } from "react";
import { Map, MapRef, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw } from "lucide-react";
import MapStatsOverlayPublic from "./MapStatsOverlayPublic";
import MarkAllPlacesPublic from "./MarkAllPlacesPublic";
import MapStyleSwitcher from "../Map/MapStyleSwitcher";
import { UserDataContext } from "@/context/UserDataContextPublicMap";
import { track } from '@vercel/analytics';

interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color: string;
  map_views_left: number;
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
  latitude: 35,
  zoom: 1.0,
  pitch: 25,
  bearing: 0,
  padding: {
    top: 0,
    bottom: 150,
    left: 0,
    right: 0
  }
};

const ROTATION_VIEW_STATE = {
  pitch: 25,
  latitude: 35,
};

const ROTATION_MIN_ZOOM = 0.8;
const ROTATION_MAX_ZOOM = 1.8;
const ROTATION_DURATION = 25000;
const ZOOM_TRANSITION_DURATION = 2000;
const LATITUDE_TRANSITION_DURATION = 2000;

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
  const startLongitudeRef = useRef<number>(DEFAULT_VIEW_STATE.longitude);
  const startLatitudeRef = useRef<number>(DEFAULT_VIEW_STATE.latitude);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(
    (userData?.map_style as MapStyle) || "satellite"
  );

  useEffect(() => {
    if (userData?.map_style && MAP_STYLES[userData.map_style as MapStyle]) {
      setCurrentMapStyle(userData.map_style as MapStyle);
      const map = mapRef.current?.getMap();
      if (map) {
        map.setStyle(MAP_STYLES[userData.map_style as MapStyle]);
      }
    }
  }, [userData?.map_style]);

  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  useEffect(() => {
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        startLongitudeRef.current = viewState.longitude;
        startLatitudeRef.current = viewState.latitude;
      }

      const rotationProgress = (timestamp - startTimeRef.current) / ROTATION_DURATION;
      const latitudeProgress = Math.min((timestamp - startTimeRef.current) / LATITUDE_TRANSITION_DURATION, 1);

      const latitudeDiff = ROTATION_VIEW_STATE.latitude - startLatitudeRef.current;
      const currentLatitude = startLatitudeRef.current + (latitudeDiff * easeInOutCubic(latitudeProgress));

      if (isRotating) {
        setViewState(prev => ({
          ...prev,
          pitch: ROTATION_VIEW_STATE.pitch,
          longitude: startLongitudeRef.current + (rotationProgress * 360) % 360,
          latitude: currentLatitude,
          zoom: prev.zoom
        }));

        if (latitudeProgress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          animationFrameId = requestAnimationFrame(animate);
        }
      }
    };

    if (isRotating) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isRotating]);

  const startRotation = () => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    const currentZoom = viewState.zoom;
    const targetZoom = currentZoom < ROTATION_MIN_ZOOM ? ROTATION_MIN_ZOOM :
      currentZoom > ROTATION_MAX_ZOOM ? ROTATION_MAX_ZOOM :
        currentZoom;

    if (currentZoom !== targetZoom) {
      map.flyTo({
        zoom: targetZoom,
        duration: ZOOM_TRANSITION_DURATION,
        essential: true
      });
    }

    startTimeRef.current = null;
    startLongitudeRef.current = viewState.longitude;
    startLatitudeRef.current = viewState.latitude;
    setIsRotating(true);
  };

  const handleMapLoad = () => {
    setIsLoading(false);
    setMapLoaded(true); 
    const map = mapRef.current?.getMap();
    map?.touchZoomRotate.enable();
    map?.touchZoomRotate.disableRotation();
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
    track('RED - Unable to load map on Public map');
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

  interface MapStyleOption {
    id: 'satellite' | 'light' | 'dark';
    imageSrc: string;
  }

  const styles: MapStyleOption[] = [
    {
      id: 'satellite',
      imageSrc: '/mapstylesatellite.png',
    },
    {
      id: 'light',
      imageSrc: '/mapstylelight.png',
    },
    {
      id: 'dark',
      imageSrc: '/mapstyledark.png',
    },
  ];

  const getCurrentStyleImage = (styleId: MapStyleOption['id']): string => {
    return styles.find(style => style.id === styleId)?.imageSrc || styles[0].imageSrc;
  };

  const handleViewStateChange = ({ viewState }: { viewState: ViewState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = viewState;
    setViewState({ longitude, latitude, zoom, pitch, bearing });
  };

  const handleStyleChange = (newStyle: MapStyle) => {
    track('Map style switched on Public map');
    setCurrentMapStyle(newStyle);
    const map = mapRef.current?.getMap();
    if (map) {
      map.setStyle(MAP_STYLES[newStyle]);
      map.touchZoomRotate.disableRotation(); // to disable rotation
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
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_PUBLIC_USER}
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
        boxZoom={false}
        doubleClickZoom={false}
        dragPan={true}
        dragRotate={false}
        keyboard={false}
        scrollZoom={true}
        touchPitch={false}
      // touchZoomRotate={true}
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
       onClick={() => {
         startRotation();
         track('Map rotated on Public map');
       }}
         className="absolute bottom-6 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-5"
         title="Resume rotation"
         type="button"
       >
         <div className="relative w-10 h-10 overflow-hidden rounded-full">
           <img
             src={getCurrentStyleImage(currentMapStyle)}
             alt="Rotate"
             className="w-full h-full object-cover animate-[spin_30s_linear_infinite]"
           />
         </div>
       </button>
      )}
    </div>
  );
};

export default React.memo(MapboxMapPublic);