import React, { useContext, useEffect, useRef, useState } from "react";
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

// Configuration
const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
      dark: "mapbox://styles/mapbox/dark-v11",
      light: "mapbox://styles/newsexpressnz/cm2wvy2vv005c01q25cl3eo0w",
    },
    rotation: {
      MIN_ZOOM: 0.8,
      MAX_ZOOM: 1.5,
      ROTATION_DURATION: 25000,
      ZOOM_SPEED: 0.09,
      TARGET_LATITUDE: 35,
      LATITUDE_TRANSITION_DURATION: 2000,
      MAX_RETRY_ATTEMPTS: 2,
    },
    fog: {
      'horizon-blend': 0.2,
      'color': '#ffffff',
      'high-color': '#245bde',
      'space-color': '#000000',
      'star-intensity': 0.6
    }
  }
} as const;

// Types
interface MapboxMapProps {
  className?: string;
  defaultStyle?: keyof typeof CONFIG.map.styles;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
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
  poiCategory: string;
  maki: string;
}

type MapStatus = {
  status: 'idle' | 'loading' | 'error' | 'ready';
  error?: string;
};

interface SearchedPlaceContextType {
  searchedPlace?: PlaceDetails;
  setSearchedPlaceDetails: (details: PlaceDetails) => void;
}

// Constants
const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -114.370789,
  latitude: 46.342303,
  zoom: 1.5,
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
  latitude: CONFIG.map.rotation.TARGET_LATITUDE,
};

const MapboxMap: React.FC<MapboxMapProps> = ({
  className = "",
  defaultStyle = "satellite"
}) => {
  // Refs
  const mapRef = useRef<MapRef>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isMountedRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const targetZoomRef = useRef<number | null>(null);
  const initialPositionRef = useRef<{ longitude: number; latitude: number } | null>(null);
  const retryAttemptsRef = useRef(0);
  const eventListenersRef = useRef<Array<{ type: string; listener: (e: any) => void }>>([]);

  // State
  const [mapStatus, setMapStatus] = useState<MapStatus>({ status: 'idle' });
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const [currentMapStyle, setCurrentMapStyle] = useState<keyof typeof CONFIG.map.styles>(defaultStyle);

  // Context
  const { searchedPlace } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;

  // Utility functions
  const isValidCoordinates = (place: PlaceDetails | undefined): place is PlaceDetails => {
    if (!place) return false;
    return (
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude) &&
      place.latitude !== 0 &&
      place.longitude !== 0
    );
  };

  const getRotationZoom = (currentZoom: number): number => {
    const { MIN_ZOOM, MAX_ZOOM } = CONFIG.map.rotation;
    return Math.min(Math.max(currentZoom, MIN_ZOOM), MAX_ZOOM);
  };

  const calculateLatitudeTransition = (elapsed: number, startLat: number): number => {
    const { LATITUDE_TRANSITION_DURATION, TARGET_LATITUDE } = CONFIG.map.rotation;
    const progress = Math.min(elapsed / LATITUDE_TRANSITION_DURATION, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    return startLat + (TARGET_LATITUDE - startLat) * easeProgress;
  };

  // Map operations
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

  const handleWebGLContextLoss = () => {
    if (!isMountedRef.current) return;
    
    retryAttemptsRef.current += 1;
    if (retryAttemptsRef.current > CONFIG.map.rotation.MAX_RETRY_ATTEMPTS) {
      setMapStatus({ 
        status: 'error', 
        error: "Unable to restore map after multiple attempts. Please refresh the page." 
      });
      return;
    }

    setMapStatus({ 
      status: 'error', 
      error: "WebGL context lost. Attempting to reload map..." 
    });
    
    cleanup();
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setMapStatus({ status: 'loading' });
      }
    }, 1000);
  };

  const cleanup = () => {
    // Cancel animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset animation refs
    animationStartTimeRef.current = null;
    initialPositionRef.current = null;
    targetZoomRef.current = null;

    // Clean up map instance
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      // Safely remove event listeners
      eventListenersRef.current.forEach(({ type, listener }) => {
        try {
          if (map && typeof map.off === 'function') {
            map.off(type, listener);
          }
        } catch (e) {
          console.warn('Error removing event listener:', e);
        }
      });
      eventListenersRef.current = [];

      try {
        // Get map container before removing layers
        const mapContainer = map.getContainer();
        const parentNode = mapContainer?.parentNode;

        // Remove layers and sources
        if (map.getStyle()) {
          const style = map.getStyle();
          style.layers?.forEach(layer => {
            try {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            } catch (e) {
              console.warn(`Error removing layer ${layer.id}:`, e);
            }
          });

          Object.keys(style.sources || {}).forEach(sourceId => {
            try {
              if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
              }
            } catch (e) {
              console.warn(`Error removing source ${sourceId}:`, e);
            }
          });
        }

        // Safely remove map container
        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
          // Fallback: manually remove container if it still exists
          if (parentNode && mapContainer && parentNode.contains(mapContainer)) {
            try {
              parentNode.removeChild(mapContainer);
            } catch (e) {
              console.warn('Error manually removing map container:', e);
            }
          }
        }
      } catch (e) {
        console.warn('Map cleanup error:', e);
      }

      mapInstanceRef.current = null;
    }

    setIsRotating(false);
    if (isMountedRef.current) {
      setMapStatus({ status: 'idle' });
    }
  };

  // Animation
  const startRotation = () => {
    if (!mapInstanceRef.current) return;

    setIsRotating(true);
    animationStartTimeRef.current = null;
    initialPositionRef.current = {
      longitude: viewState.longitude,
      latitude: viewState.latitude
    };
    
    const targetZoom = getRotationZoom(viewState.zoom);
    targetZoomRef.current = targetZoom;

    mapInstanceRef.current.flyTo({
      center: [viewState.longitude, ROTATION_VIEW_STATE.latitude],
      zoom: targetZoom,
      pitch: ROTATION_VIEW_STATE.pitch,
      duration: CONFIG.map.rotation.LATITUDE_TRANSITION_DURATION,
      essential: true
    });
  };

  const handleMapLoad = () => {
    if (!mapRef.current || mapInstanceRef.current || !isMountedRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.getContainer()) return;

    mapInstanceRef.current = map;

    safeMapOperation(async () => {
      map.touchZoomRotate?.enable();
      map.touchZoomRotate?.disableRotation();

      // Wait for style to load with timeout
      try {
        await Promise.race([
          new Promise<void>((resolve) => {
            if (map.isStyleLoaded()) {
              resolve();
            } else {
              const listener = () => resolve();
              map.once('style.load', listener);
              eventListenersRef.current.push({ type: 'style.load', listener });
            }
          }),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error('Style load timeout')), 10000)
          )
        ]);
      } catch (error) {
        console.warn('Style load error:', error);
      }

      if (!isMountedRef.current) return;

      try {
        map.setFog(CONFIG.map.fog);
      } catch (e) {
        console.warn('Error setting fog:', e);
      }

      if (isMountedRef.current) {
        setMapStatus({ status: 'ready' });
        if (!isValidCoordinates(searchedPlace)) {
          startRotation();
        }
      }
    });
  };


  const handleStyleChange = async (newStyle: keyof typeof CONFIG.map.styles) => {
    if (currentMapStyle === newStyle) return;

    await safeMapOperation(async () => {
      if (!mapInstanceRef.current) return;
      
      track('Map style switched on Create map');
      // setMapStatus({ status: 'loading' });
      
      const map = mapInstanceRef.current;
      const wasRotating = isRotating;
      
      try {
        // Save viewport state
        const viewport = {
          center: map.getCenter(),
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch()
        };

        // Switch style
        map.setStyle(CONFIG.map.styles[newStyle]);

        // Restore viewport after style loads
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Style load timeout'));
          }, 10000);

          const handleStyleLoad = () => {
            clearTimeout(timeoutId);
            map.setCenter(viewport.center);
            map.setZoom(viewport.zoom);
            map.setBearing(viewport.bearing);
            map.setPitch(viewport.pitch);
            
            setCurrentMapStyle(newStyle);
            // setMapStatus({ status: 'ready' });

            if (wasRotating && !isValidCoordinates(searchedPlace)) {
              startRotation();
            }
            
            resolve();
          };

          map.once('style.load', handleStyleLoad);
          eventListenersRef.current.push({ 
            type: 'style.load', 
            listener: handleStyleLoad 
          });
        });
      } catch (error) {
        console.warn('Style switch error:', error);
        // setMapStatus({ 
        //   status: 'error', 
        //   error: 'Failed to switch map style. Please try again.' 
        // });
      }
    });
  };

  const handleMapError = () => {
    track('RED - Unable to load map on Create map');
    if (isMountedRef.current) {
      setMapStatus({ 
        status: 'error', 
        error: "Unable to load map. Please refresh the page." 
      });
    }
    cleanup();
  };

  const handleMapInteraction = () => {
    setIsRotating(false);
  };

  const handleViewStateChange = ({ viewState: newViewState }: { viewState: ViewState }) => {
    setViewState({
      longitude: newViewState.longitude,
      latitude: newViewState.latitude,
      zoom: newViewState.zoom,
      pitch: newViewState.pitch ?? 0,
      bearing: newViewState.bearing ?? 0,
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Create a flag to track if we're unmounting
    let isUnmounting = false;

    return () => {
      isUnmounting = true;
      
      // Run cleanup synchronously before React tries to remove the node
      cleanup();
      
      // Ensure we don't try to update state during unmount
      if (isUnmounting) {
        isMountedRef.current = false;
      }
    };
  }, []);


  useEffect(() => {
    if (!isRotating || isValidCoordinates(searchedPlace)) return;

    const animate = (timestamp: number) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
        initialPositionRef.current = {
          longitude: viewState.longitude,
          latitude: viewState.latitude
        };
      }

      const elapsed = timestamp - animationStartTimeRef.current;
      const { ROTATION_DURATION, ZOOM_SPEED } = CONFIG.map.rotation;
      
      const rotationProgress = (elapsed % ROTATION_DURATION) / ROTATION_DURATION;
      const startPosition = initialPositionRef.current!;
      
      const newLongitude = startPosition.longitude + (rotationProgress * 360);
      const newLatitude = calculateLatitudeTransition(elapsed, startPosition.latitude);

      const targetZoom = targetZoomRef.current ?? getRotationZoom(viewState.zoom);
      const zoomDiff = targetZoom - viewState.zoom;
      const newZoom = viewState.zoom + (zoomDiff * ZOOM_SPEED);

      setViewState(prev => ({
        ...prev,
        longitude: newLongitude,
        latitude: Math.abs(newLatitude - ROTATION_VIEW_STATE.latitude) > 0.01 
          ? newLatitude 
          : ROTATION_VIEW_STATE.latitude,
        zoom: newZoom,
        pitch: ROTATION_VIEW_STATE.pitch
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRotating, searchedPlace, viewState.longitude, viewState.zoom]);

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

  // Access token validation
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER) {
    track('RED - Mapbox access token is missing on Create map');
  }

  return (
    <div 
      className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive map"
    >
      {mapStatus.status === 'loading' && (
        <div 
          className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10"
          role="alert"
          aria-live="polite"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="sr-only">Loading map...</span>
        </div>
      )}

      {mapStatus.status === 'error' && (
        <div 
          className="absolute top-10 left-4 right-4 z-10"
          role="alert"
          aria-live="assertive"
        >
          <Alert variant="destructive">
            <AlertDescription>{mapStatus.error}</AlertDescription>
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
        mapStyle={CONFIG.map.styles[currentMapStyle]}
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
        {mapStatus.status === 'ready' && (
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

      {!isRotating && mapStatus.status !== 'error' && (
        <button
          onClick={() => {
            startRotation();
            track('Map rotated on Create map');
          }}
          className="absolute bottom-6 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-5"
          aria-label={`Resume map rotation - Current style: ${currentMapStyle}`}
          type="button"
        >
          <div className="relative w-10 h-10 overflow-hidden rounded-full">
            <img
              src={`/mapstyle${currentMapStyle}.png`}
              alt=""
              className="w-full h-full object-cover animate-[spin_30s_linear_infinite]"
            />
          </div>
        </button>
      )}
    </div>
  );
};

// Use React.memo with custom comparison function
export default React.memo(MapboxMap, (prevProps, nextProps) => {
  return (
    prevProps.className === nextProps.className &&
    prevProps.defaultStyle === nextProps.defaultStyle
  );
});