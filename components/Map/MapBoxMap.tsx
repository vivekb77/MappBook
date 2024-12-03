import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Map, MapRef, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import MapStatsOverlay from "./MapStatsOverlay";
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";
import MapStyleSwitcher from "./MapStyleSwitcher";
import { track } from '@vercel/analytics';

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/newsexpressnz/cm2wvy2vv005c01q25cl3eo0w",
};

const ROTATION_CONSTRAINTS = {
  MIN_ZOOM: 0.8,
  MAX_ZOOM: 2.0,
  ROTATION_DURATION: 25000,
  ZOOM_SPEED: 0.09,
  TARGET_LATITUDE: 35,
  LATITUDE_TRANSITION_DURATION: 2000
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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isMountedRef = useRef(true);
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
  const shouldStartRotationRef = useRef(true);

  const { searchedPlace } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;

  // Safe map operations wrapper
  const safeMapOperation = async (operation: () => Promise<void> | void) => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;
    try {
      await operation();
    } catch (error) {
      console.warn('Map operation error:', error);
      if (error instanceof Error && error.message.includes('webgl context lost')) {
        handleWebGLContextLoss();
      }
    }
  };

  // Handle WebGL context loss
  const handleWebGLContextLoss = () => {
    if (!isMountedRef.current) return;
    setError("WebGL context lost. Reloading map...");
    cleanup();
    // Attempt to reinitialize after a brief delay
    setTimeout(() => {
      if (isMountedRef.current) {
        setError(null);
        setIsLoading(true);
      }
    }, 1000);
  };

  const eventListenersRef = useRef<Array<{
    type: string;
    listener: (e: any) => void;
  }>>([]);

  // Enhanced cleanup function
  const cleanup = () => {
    return new Promise<void>((resolve) => {
      // Cancel any ongoing animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // Reset all refs
      startTimeRef.current = null;
      initialLongitudeRef.current = null;
      initialLatitudeRef.current = null;
      targetZoomRef.current = null;

      // Clean up map instance
      requestAnimationFrame(() => {
        if (mapInstanceRef.current) {
          try {
            const map = mapInstanceRef.current;

            // Remove all event listeners
            if (mapInstanceRef.current) {
              const map = mapInstanceRef.current;
              // Remove all stored listeners
              eventListenersRef.current.forEach(({ type, listener }) => {
                map.off(type, listener);
              });
              eventListenersRef.current = [];
            }

            setIsRotating(false);
            shouldStartRotationRef.current = true;

            // Remove all layers
            map.getStyle().layers?.forEach(layer => {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            });

            // Remove all sources
            Object.keys(map.getStyle().sources || {}).forEach(sourceId => {
              if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
              }
            });

            // Remove map only if it's still attached to DOM
            if (map.getContainer().parentNode) {
              map.remove();
            }
          } catch (e) {
            console.warn('Map cleanup error:', e);
          }
          mapInstanceRef.current = null;
        }

        // Reset states
        if (isMountedRef.current) {
          setMapLoaded(false);
          setIsLoading(true);
          setError(null);
        }

        resolve();
      });
    });
  };

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
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    return startLat + (ROTATION_CONSTRAINTS.TARGET_LATITUDE - startLat) * easeProgress;
  };

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const startRotation = () => {
    if (!mapInstanceRef.current) return;

    setIsRotating(true);
    shouldStartRotationRef.current = true;
    startTimeRef.current = null;
    initialLongitudeRef.current = viewState.longitude;
    initialLatitudeRef.current = viewState.latitude;
    const targetZoom = getRotationZoom(viewState.zoom);
    targetZoomRef.current = targetZoom;

    mapInstanceRef.current.flyTo({
      center: [viewState.longitude, ROTATION_VIEW_STATE.latitude],
      zoom: targetZoom,
      pitch: ROTATION_VIEW_STATE.pitch,
      duration: ROTATION_CONSTRAINTS.LATITUDE_TRANSITION_DURATION,
      essential: true
    });
  };

  // Animation effect
  useEffect(() => {
    if (!mapInstanceRef.current || !isRotating || isValidCoordinates(searchedPlace)) {
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        initialLongitudeRef.current = viewState.longitude;
        initialLatitudeRef.current = viewState.latitude;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rotationProgress = (elapsed % ROTATION_CONSTRAINTS.ROTATION_DURATION) / ROTATION_CONSTRAINTS.ROTATION_DURATION;
      const startLongitude = initialLongitudeRef.current ?? viewState.longitude;
      const newLongitude = startLongitude + (rotationProgress * 360);

      const startLat = initialLatitudeRef.current ?? viewState.latitude;
      const newLatitude = calculateLatitudeTransition(elapsed, startLat);

      const targetZoom = targetZoomRef.current ?? getRotationZoom(viewState.zoom);
      const currentZoom = viewState.zoom;
      const zoomDiff = targetZoom - currentZoom;
      const newZoom = currentZoom + (zoomDiff * ROTATION_CONSTRAINTS.ZOOM_SPEED);

      setViewState(prev => ({
        ...prev,
        longitude: newLongitude,
        latitude: Math.abs(newLatitude - ROTATION_CONSTRAINTS.TARGET_LATITUDE) > 0.01 ? newLatitude : ROTATION_CONSTRAINTS.TARGET_LATITUDE,
        zoom: newZoom,
        pitch: ROTATION_VIEW_STATE.pitch
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isRotating, searchedPlace, viewState.longitude, viewState.zoom]);

  // Map initialization
  const handleMapLoad = () => {
    if (!mapRef.current || mapInstanceRef.current || !isMountedRef.current) return;

    const map = mapRef.current.getMap();
    mapInstanceRef.current = map;

    safeMapOperation(async () => {
      map.touchZoomRotate.enable();
      map.touchZoomRotate.disableRotation();

      // Wait for style to be fully loaded
      await new Promise<void>((resolve) => {
        if (map.isStyleLoaded()) {
          resolve();
        } else {
          map.once('style.load', () => resolve());
        }
      });

      map.setFog({
        'horizon-blend': 0.2,
        'color': '#ffffff',
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.6
      });

      if (isMountedRef.current) {
        setIsLoading(false);
        setMapLoaded(true);
        setError(null);

        // Start rotation if we should and no place is selected
        if (shouldStartRotationRef.current && !isValidCoordinates(searchedPlace)) {
          startRotation();
        }
      }
    });
  };

  // Handle searched place updates
  useEffect(() => {
    if (!isValidCoordinates(searchedPlace) || !mapInstanceRef.current) return;

    setIsRotating(false);
    const { longitude, latitude } = searchedPlace;

    safeMapOperation(async () => {
      if (!mapInstanceRef.current) return;

      mapInstanceRef.current.touchZoomRotate.disableRotation();
      mapInstanceRef.current.flyTo({
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
    });
  }, [searchedPlace]);

  
  const handleStyleChange = async (newStyle: keyof typeof MAP_STYLES) => {
    // Return early if the same style is selected
    if (currentMapStyle === newStyle) {
        return;
    }

    await safeMapOperation(async () => {
        if (!mapInstanceRef.current) return;
        
        track('Map style switched on Create map');
        setIsLoading(true);
        
        const map = mapInstanceRef.current;
        const wasRotating = isRotating;
        
        try {
            // Save current state
            const center = map.getCenter();
            const zoom = map.getZoom();
            const bearing = map.getBearing();
            const pitch = map.getPitch();

            // Set new style
            map.setStyle(MAP_STYLES[newStyle]);

            // Wait for style to load and restore viewport
            await new Promise<void>((resolve) => {
                map.once('style.load', () => {
                    map.setCenter(center);
                    map.setZoom(zoom);
                    map.setBearing(bearing);
                    map.setPitch(pitch);
                    
                    setCurrentMapStyle(newStyle);
                    setIsLoading(false);

                    // Restore rotation if it was active
                    if (wasRotating && shouldStartRotationRef.current) {
                        startRotation();
                    }
                    
                    resolve();
                });
            });
        } catch (error) {
            console.warn('Style switch error:', error);
            setError('Failed to switch map style');
            setIsLoading(false);
        }
    });
};

  const handleMapError = (e: { type: "error"; error: Error }) => {
    track('RED - Unable to load map on Create map');
    if (isMountedRef.current) {
      setError("Unable to load map. Please try again later.");
      setIsLoading(false);
      setMapLoaded(false);
    }
    cleanup();
  };

  const handleMapInteraction = () => {
    setIsRotating(false);
    shouldStartRotationRef.current = false;
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
            <AlertDescription>Unable to load map. Please refresh the page.</AlertDescription>
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
        reuseMaps={false}
        preserveDrawingBuffer={true}
        attributionControl={false}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        style={{ width: '100%', height: '100%' }}
        boxZoom={false}
        doubleClickZoom={false}
        dragPan={true}
        dragRotate={false}
        keyboard={false}
        scrollZoom={true}
        touchPitch={false}
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
          onClick={() => {
            startRotation();
            track('Map rotated on Create map');
          }}
          className="absolute bottom-6 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-5"
          aria-label="Resume map rotation"
          type="button"
        >
          <div className="relative w-10 h-10 overflow-hidden rounded-full">
            <img
              src={`/mapstyle${currentMapStyle}.png`}
              alt="Rotate map"
              className="w-full h-full object-cover animate-[spin_30s_linear_infinite]"
            />
          </div>
        </button>
      )}
    </div>
  );
};

export default React.memo(MapboxMap);