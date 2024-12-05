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
import { nanoid } from 'nanoid';

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
      MAX_ZOOM: 0.8,
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
  const mapContainerId = useRef(`map-container-${nanoid()}`);
  // State
  const [mapStatus, setMapStatus] = useState<MapStatus>({ status: 'loading' });
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const [currentMapStyle, setCurrentMapStyle] = useState<keyof typeof CONFIG.map.styles>(defaultStyle);
  const [persistentError, setPersistentError] = useState<string | null>(null);

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

  const handleWebGLContextLoss = () => {
    if (!isMountedRef.current) return;

    retryAttemptsRef.current += 1;

    setMapStatus({
      status: 'error',
      error: retryAttemptsRef.current > CONFIG.map.rotation.MAX_RETRY_ATTEMPTS
        ? "Unable to restore map after multiple attempts. Please refresh the page."
        : "WebGL context lost. Attempting to reload map..."
    });

    // Delay cleanup to allow error UI to render
    setTimeout(() => {
      if (isMountedRef.current) {
        cleanup();

        // Only attempt reload if we haven't exceeded max retries
        if (retryAttemptsRef.current <= CONFIG.map.rotation.MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setMapStatus({ status: 'loading' });
            }
          }, 1000);
        }
      }
    }, 100);
  };

  const cleanup = () => {
    if (!isMountedRef.current) return;

    // Cancel any ongoing animations
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

      // Remove event listeners
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
        // Get map container and parent before cleanup
        const container = map.getContainer();
        const parent = container?.parentNode;

        // Remove layers and sources safely
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

        // Remove map with fallback
        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
          // Fallback: manual container removal
          if (parent && container && parent.contains(container)) {
            try {
              parent.removeChild(container);
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

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Run cleanup synchronously before unmount
      cleanup();
    };
  }, []);

  // Map operations
  const safeMapOperation = async (operation: () => Promise<void> | void) => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;
    try {
      await operation();
    } catch (error) {
      console.warn('Map operation error:', error);

      // Check specifically for WebGL/transformation errors
      if (error instanceof Error &&
        (error.message.includes('webgl context lost') ||
          error.message.includes('transformMat4'))) {
        handleWebGLContextLoss();
      } else {
        handleMapError();
      }
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

    map.on('error', (e) => {
      if (isMountedRef.current) {
        setMapStatus({
          status: 'error',
          error: "Unable to load map. Please refresh the page."
        });
      }
    });

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

      track('Create Map - Map style switched');
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
    // First set the error status before any cleanup
    if (isMountedRef.current) {
      setMapStatus({
        status: 'error',
        error: "Unable to load map. Please refresh the page."
      });
    }
    setPersistentError("Unable to load map. Please refresh the page.");
    track('RED - Create Map - Unable to load map');
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
    track('RED - Create Map - Mapbox access token is missing');
  }

  return ( 
    <div
      id={mapContainerId.current}
      className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive map"
    >
      {mapStatus.status === 'loading' && (
        <div className="viewport-height w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-100" />
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-pink-400" 
                 style={{ animationDirection: 'reverse' }} />
          </div>
          <span className="text-lg font-medium text-gray-700">
            Loading 🌎
          </span>
        </div>
      </div>
      )}

      {persistentError && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
          role="alert"
          aria-live="assertive"
        >
          <div className="mx-4 w-full max-w-md bg-gradient-to-r from-[#FFB1F1] to-[#B995FF] p-0.5 rounded-lg">
            <Alert variant="destructive" className="bg-white m-0 border-none">
              <AlertDescription className="text-center text-[#F364DE]">
                Unable to load MappBook, please refresh the page.
              </AlertDescription>
            </Alert>
          </div>
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

      {!isRotating && mapStatus.status === 'ready' && (
        <button
          onClick={() => {
            startRotation();
            track('Create Map - Map rotated'); 
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