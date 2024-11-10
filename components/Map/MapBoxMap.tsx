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

const ROTATION_CONSTRAINTS = {
  MIN_ZOOM: 0.8,
  MAX_ZOOM: 2.0,
  ROTATION_DURATION: 25000, // 25 seconds for full rotation
  ZOOM_SPEED: 0.09, // Lower value = smoother zoom transition
  TARGET_LATITUDE: 35,
  LATITUDE_TRANSITION_DURATION: 2000 // 2 seconds for latitude transition
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
  zoom: 0.8,
  pitch: 25,
  bearing: 0,
  padding: {
    top: 0,
    bottom: 320,
    left: 0,
    right: 0
  }
};

const ROTATION_VIEW_STATE = {
  pitch: 25,
  latitude: ROTATION_CONSTRAINTS.TARGET_LATITUDE,
};

const MapboxMap: React.FC<MapboxMapProps> = ({
  className = "",
  defaultStyle = "satellite"
}) => {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const targetZoomRef = useRef<number | null>(null);
  const initialLongitudeRef = useRef<number | null>(null);
  const initialLatitudeRef = useRef<number | null>(null);
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

  const getRotationZoom = (currentZoom: number) => {
    return Math.min(Math.max(currentZoom, ROTATION_CONSTRAINTS.MIN_ZOOM), ROTATION_CONSTRAINTS.MAX_ZOOM);
  };

  const calculateLatitudeTransition = (elapsed: number, startLat: number) => {
    const progress = Math.min(elapsed / ROTATION_CONSTRAINTS.LATITUDE_TRANSITION_DURATION, 1);
    // Easing function for smooth transition
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic easing out
    return startLat + (ROTATION_CONSTRAINTS.TARGET_LATITUDE - startLat) * easeProgress;
  };

  const startRotation = () => {
    setIsRotating(true);
    startTimeRef.current = null;
    initialLongitudeRef.current = viewState.longitude;
    initialLatitudeRef.current = viewState.latitude;
    const targetZoom = getRotationZoom(viewState.zoom);
    targetZoomRef.current = targetZoom;

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        center: [viewState.longitude, ROTATION_VIEW_STATE.latitude],
        zoom: targetZoom,
        pitch: ROTATION_VIEW_STATE.pitch,
        duration: ROTATION_CONSTRAINTS.LATITUDE_TRANSITION_DURATION,
        essential: true
      });
    }
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        initialLongitudeRef.current = viewState.longitude;
        initialLatitudeRef.current = viewState.latitude;
      }

      if (isRotating) {
        const elapsed = timestamp - startTimeRef.current;
        const rotationProgress = (elapsed % ROTATION_CONSTRAINTS.ROTATION_DURATION) / ROTATION_CONSTRAINTS.ROTATION_DURATION;
        const startLongitude = initialLongitudeRef.current ?? viewState.longitude;
        const newLongitude = startLongitude + (rotationProgress * 360);

        // Calculate latitude transition
        const startLat = initialLatitudeRef.current ?? viewState.latitude;
        const newLatitude = calculateLatitudeTransition(elapsed, startLat);

        // Handle zoom transition
        const targetZoom = targetZoomRef.current ?? getRotationZoom(viewState.zoom);
        const currentZoom = viewState.zoom;
        const zoomDiff = targetZoom - currentZoom;
        const newZoom = currentZoom + (zoomDiff * ROTATION_CONSTRAINTS.ZOOM_SPEED);

        setViewState(prev => ({
          ...prev,
          longitude: newLongitude,
          latitude: newLatitude,
          zoom: newZoom,
          pitch: ROTATION_VIEW_STATE.pitch
        }));

        // Continue animation only if latitude hasn't reached target
        if (Math.abs(newLatitude - ROTATION_CONSTRAINTS.TARGET_LATITUDE) > 0.01) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Once target latitude is reached, continue with just longitude rotation
          setViewState(prev => ({
            ...prev,
            longitude: newLongitude,
            latitude: ROTATION_CONSTRAINTS.TARGET_LATITUDE,
            zoom: newZoom,
            pitch: ROTATION_VIEW_STATE.pitch
          }));
          animationRef.current = requestAnimationFrame(animate);
        }
      }
    };

    if (isRotating && !isValidCoordinates(searchedPlace)) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRotating, searchedPlace, viewState.longitude, viewState.zoom]);

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
    setMapLoaded(true);
  };

  const handleMapError = (e: any) => {
    setError("Unable to load map. Please try again later.");
    setIsLoading(false);
    setMapLoaded(false);
  };

  useEffect(() => {
    if (isValidCoordinates(searchedPlace) && mapRef.current) {
      setIsRotating(false);
      const { longitude, latitude } = searchedPlace;
      const map = mapRef.current.getMap();
      map.touchZoomRotate.disableRotation(); // to disable rotation
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        pitch: 45,
        bearing: 0,
        duration: 2000,
        essential: true
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
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
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
        boxZoom={false}
        doubleClickZoom={false}
        dragPan={true}
        dragRotate={false}
        keyboard={false}
        scrollZoom={true}
        touchPitch={false} //When enabled, users on touch devices can use two fingers to adjust the map's pitch (tilt)
        touchZoomRotate={true}
      >
        {mapLoaded && (
          <>
            <MarkAllPlaces />
            <MapStatsOverlay />
            <MarkSearchedPlace />
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