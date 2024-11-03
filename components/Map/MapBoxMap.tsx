import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Map, MapRef, MapLayerMouseEvent, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw } from "lucide-react";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import MapStatsOverlay from "./MapStatsOverlay";
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";
import MapStyleSwitcher from "./MapStyleSwitcher";

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/newsexpressnz/cm2wvy2vv005c01q25cl3eo0w",
};
interface MapboxMapProps {
  className?: string;
  defaultStyle?: "satellite" | "light" | "dark";
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

interface PlaceDetails {
  longitude: number;
  latitude: number;
  mapboxId: string;
  name: string;
  address: string;
  country: string;
  countryCode: string;
  language: string;
  poiCategory?: string;
  maki?: string;
}

interface SearchedPlaceContextType {
  searchedPlace?: PlaceDetails;
  setSearchedPlaceDetails: (details: PlaceDetails) => void;
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -114.370789,
  latitude: 46.342303,
  zoom: 0.8, // Slightly zoomed in initial state
  pitch: 25, //controls slanting
  bearing: 0,
  padding: {
    top: 0,      
    bottom: 300,  // Add bottom padding to account for the Create button
    left: 0,
    right: 0
  }
};

const ROTATION_VIEW_STATE = {
  // zoom: 0.9, // More zoomed out during rotation
  pitch: 25,
  latitude: 35, // Slightly tilted view for better globe perspective
};

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
  const [currentMapStyle, setCurrentMapStyle] = useState<keyof typeof MAP_STYLES>(defaultStyle);

  const { searchedPlace } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;
  const mapStyle = useMemo(() => MAP_STYLES[defaultStyle], [defaultStyle]);

  const isValidCoordinates = (place: PlaceDetails | undefined): place is PlaceDetails => {
    if (!place) return false;

    return (
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude) &&
      Object.keys(place).length > 0 &&
      place.latitude !== 0 &&
      place.longitude !== 0
    );
  };

  // Initialize rotation with zoom out effect
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


  // Globe rotation animation
  useEffect(() => {
    const SILICON_VALLEY_LONGITUDE = -100;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = (timestamp - startTimeRef.current) / 25000;

      if (isRotating) {
        setViewState(prev => ({
          ...prev,
          ...ROTATION_VIEW_STATE,
          // Start from Silicon Valley and rotate
          longitude: SILICON_VALLEY_LONGITUDE + (progress * 360) % 360,
        }));
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isRotating && !isValidCoordinates(searchedPlace)) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRotating, searchedPlace]);

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

  const handleMapError = (e: any) => {
    setError("Unable to load map. Please try again later.");
    setIsLoading(false);
  };

  useEffect(() => {
    if (isValidCoordinates(searchedPlace) && mapRef.current) {
      setIsRotating(false);
      const { longitude, latitude } = searchedPlace;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: 14,
        pitch: 45,
        bearing: 0,
        curve: 1.5,
        easing: (t: number) => t * (2 - t),
        essential: true,
      });

      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: 14,
        pitch: 45,
        bearing: 0,
      }));
    }
  }, [searchedPlace]);

  const handleMapInteraction = () => {
    setIsRotating(false);
  };

  const handleViewStateChange = (evt: { viewState: ViewState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = evt.viewState;
    setViewState({
      longitude,
      latitude,
      zoom,
      pitch,
      bearing,
    });
  };
  // Add handler for style changes
  const handleStyleChange = (newStyle: keyof typeof MAP_STYLES) => {
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
            <AlertDescription>Unable to load map. Please try again later.</AlertDescription>
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
        <MarkAllPlaces />
        <MapStatsOverlay />
        <MarkSearchedPlace />
        <MapStyleSwitcher
          currentStyle={currentMapStyle}
          onStyleChange={handleStyleChange}
        />
      </Map>

      {!isRotating && !error && (
       <button
       onClick={startRotation}
       className="absolute bottom-4 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-5"
       title="Resume rotation"
       type="button"
     >
       <RotateCcw className="w-5 h-5 text-gray-700" />
     </button>
      )}
    </div>
  );
};

export default React.memo(MapboxMap);