import React, { useEffect, useRef, useState } from "react";
import { Map, MapRef, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw } from "lucide-react";
import MapStatsOverlayPublic from "./MapStatsOverlayPublic";
import MarkAllPlacesPublic from "./MarkAllPlacesPublic";
import MapStyleSwitcher from "../Map/MapStyleSwitcher";

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/newsexpressnz/cm2wvy2vv005c01q25cl3eo0w",
} as const;

type MapStyle = keyof typeof MAP_STYLES;

interface MapboxMapProps {
  className?: string;
  defaultStyle?: MapStyle;
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
};

const ROTATION_VIEW_STATE = {
  pitch: 25,
  latitude: 35,
};

const SILICON_VALLEY_LONGITUDE = -100;
const ROTATION_DURATION = 25000;

const MapboxMap: React.FC<MapboxMapProps> = ({
  className = "",
  defaultStyle = "satellite"
}) => {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(defaultStyle);

  // Globe rotation animation
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = (timestamp - startTimeRef.current) / ROTATION_DURATION;

      if (isRotating) {
        setViewState(prev => ({
          ...prev,
          ...ROTATION_VIEW_STATE,
          longitude: SILICON_VALLEY_LONGITUDE + (progress * 360) % 360,
        }));
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isRotating) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.setFog({
        'horizon-blend': 0.2,
        'color': '#ffffff',
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.6
      });
    }
  };

  const handleMapError = () => {
    setError("Failed to load map. Please check your connection and try again.");
    setIsLoading(false);
  };

  const handleMapInteraction = () => {
    setIsRotating(false);
  };

  const handleViewStateChange = (evt: { viewState: ViewState }) => {
    setViewState({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      pitch: evt.viewState.pitch,
      bearing: evt.viewState.bearing,
    });
  };

  const handleStyleChange = (newStyle: MapStyle) => {
    setCurrentMapStyle(newStyle);
    if (mapRef.current) {
      mapRef.current.getMap().setStyle(MAP_STYLES[newStyle]);
    }
  };

  return (
    <div className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="absolute top-10 left-4 right-4 z-1">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
        style={{ width: '100%', height: '100%' }}
      >
        <MarkAllPlacesPublic />
        <MapStatsOverlayPublic />
        <MapStyleSwitcher
          currentStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
        />
      </Map>

      {!isRotating && (
        <button
          onClick={startRotation}
          className="absolute bottom-4 right-4 p-2 bg-white/80 hover:bg-white shadow-md rounded-full transition-colors"
          title="Resume rotation"
        >
          <RotateCcw className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
};

export default React.memo(MapboxMap);