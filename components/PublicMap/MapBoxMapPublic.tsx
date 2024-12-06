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
import { nanoid } from 'nanoid';

interface UserData {
  mappbook_user_id: string;
  display_name: string;
  is_premium_user: boolean;
  map_style: string;
  country_fill_color: string;
  map_views_left: number | null;
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
  zoom: 0.8,
  pitch: 25,
  bearing: 0,
  padding: {
    top: 0,
    bottom: 150,
    left: 0,
    right: 0
  }
};

type MapEventListener = {
  type: string;
  listener: (e: any) => void;
};

const ROTATION_VIEW_STATE = {
  pitch: 25,
  latitude: 35,
};

const ROTATION_MIN_ZOOM = 0.8;
const ROTATION_MAX_ZOOM = 0.8;
const ROTATION_DURATION = 25000;
const ZOOM_TRANSITION_DURATION = 2000;
const LATITUDE_TRANSITION_DURATION = 2000;

const MapboxMapPublic: React.FC<MapboxMapProps> = ({
  className = "",
}) => {
  const userData = useContext(UserDataContext);
  const mapRef = useRef<MapRef>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const eventListenersRef = useRef<Array<{ type: string; listener: (e: any) => void }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const initialPositionRef = useRef<{ longitude: number; latitude: number } | null>(null);
  const targetZoomRef = useRef<number | null>(null);
  const mapContainerId = useRef(`map-container-${nanoid()}`);
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isRotating, setIsRotating] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(
    (userData?.map_style as MapStyle) || "satellite"
  );

  // Cleanup function
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

    // Clean up map instance
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      // Remove event listeners
      eventListenersRef.current.forEach(({ type, listener }) => {
        try {
          map.off(type, listener);
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
        const style = map.getStyle();
        if (style?.layers) {
          style.layers.forEach(layer => {
            try {
              if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
              }
            } catch (e) {
              console.warn(`Error removing layer ${layer.id}:`, e);
            }
          });
        }

        if (style?.sources) {
          Object.keys(style.sources).forEach(sourceId => {
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
  };

  // Component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

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
    if (!mapLoaded || error) return;

    const animate = (timestamp: number) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
        initialPositionRef.current = {
          longitude: viewState.longitude,
          latitude: viewState.latitude
        };
      }

      const progress = (timestamp - animationStartTimeRef.current) / ROTATION_DURATION;
      const latitudeProgress = Math.min((timestamp - animationStartTimeRef.current) / LATITUDE_TRANSITION_DURATION, 1);

      const latitudeDiff = ROTATION_VIEW_STATE.latitude - initialPositionRef.current!.latitude;
      const currentLatitude = initialPositionRef.current!.latitude + (latitudeDiff * easeInOutCubic(latitudeProgress));

      if (isRotating) {
        setViewState(prev => ({
          ...prev,
          pitch: ROTATION_VIEW_STATE.pitch,
          longitude: initialPositionRef.current!.longitude + (progress * 360) % 360,
          latitude: currentLatitude,
          zoom: prev.zoom
        }));

        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    if (isRotating) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRotating, mapLoaded, error, viewState.zoom]);
  const startRotation = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const currentZoom = viewState.zoom;
    const targetZoom = Math.min(
      Math.max(currentZoom, ROTATION_MIN_ZOOM),
      ROTATION_MAX_ZOOM
    );

    if (currentZoom !== targetZoom) {
      map.flyTo({
        zoom: targetZoom,
        duration: ZOOM_TRANSITION_DURATION,
        essential: true
      });
    }

    // Reset animation refs
    animationStartTimeRef.current = null;
    initialPositionRef.current = {
      longitude: viewState.longitude,
      latitude: viewState.latitude
    };
    targetZoomRef.current = targetZoom;

    setIsRotating(true);
  };

  const handleMapLoad = () => {
    setIsLoading(false);
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (map) {
      mapInstanceRef.current = map; // Add this line
      map.touchZoomRotate.enable();
      map.touchZoomRotate.disableRotation();
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
    const errorMessage = error?.error?.message || "Unable to load map, please refresh the page.";
    track('RED - Public Map - Unable to load map', { error: errorMessage });
    setError(errorMessage);
    setIsLoading(false);
    setIsRotating(false);
    setMapLoaded(false);
  };

  const handleMapInteraction = () => {
    if (isRotating) {
      setIsRotating(false);
    }
  };

  const handleStyleChange = async (newStyle: MapStyle) => {
    if (!isMountedRef.current || currentMapStyle === newStyle) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    const wasRotating = isRotating;
    setIsRotating(false);

    try {
      // Save viewport state
      const viewport = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };

      // Clean up existing listeners
      eventListenersRef.current.forEach(({ type, listener }) => {
        map.off(type, listener);
      });
      eventListenersRef.current = [];

      // Apply new style
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Style load timeout')), 9000);

        const handleStyleLoad = () => {
          if (!isMountedRef.current) return;

          clearTimeout(timeoutId);
          try {
            map.setCenter(viewport.center);
            map.setZoom(viewport.zoom);
            map.setBearing(viewport.bearing);
            map.setPitch(viewport.pitch);

            if (wasRotating) {
              startRotation();
            }

            setCurrentMapStyle(newStyle);
            resolve();
          } catch (e) {
            console.warn('Error restoring viewport:', e);
            resolve();
          }
        };

        map.once('style.load', handleStyleLoad);
        eventListenersRef.current.push({ type: 'style.load', listener: handleStyleLoad });
        map.setStyle(MAP_STYLES[newStyle]);
      });

      track('Public Map - Map style switched');
    } catch (error) {
      console.warn('Style switch error:', error);
      // Fallback to basic style change
      map.setStyle(MAP_STYLES[newStyle]);
      setCurrentMapStyle(newStyle);
    }
  };

  const handleViewStateChange = ({ viewState: newViewState }: { viewState: ViewState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = newViewState;
    setViewState({ longitude, latitude, zoom, pitch, bearing });
  };

  const styles = [
    { id: 'satellite' as const, imageSrc: '/mapstylesatellite.png' },
    { id: 'light' as const, imageSrc: '/mapstylelight.png' },
    { id: 'dark' as const, imageSrc: '/mapstyledark.png' },
  ];

  const getCurrentStyleImage = (styleId: MapStyle): string => {
    return styles.find(style => style.id === styleId)?.imageSrc || styles[0].imageSrc;
  };

  if (error) {
    return (
      <>
        {/* Background overlay - no pointer events */}
        <div 
          className="absolute inset-0 z-30 bg-black/50 pointer-events-none" 
          aria-hidden="true"
        />
        
        {/* Error message - positioned to not interfere with button */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
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
      </>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div
      id={mapContainerId.current}
      className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive map"
    >
      {isLoading && (
        <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-50">
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
        reuseMaps={true}
        attributionControl={false}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        boxZoom={false}
        doubleClickZoom={false}
        dragPan={true}
        dragRotate={false}
        keyboard={false}
        scrollZoom={true}
        touchPitch={false}
      >
        {mapLoaded && !error &&(
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
            track('Public Map - Map rotated');
          }}
          className="absolute bottom-6 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white/100 transition-colors z-50"
          title="Resume rotation"
          type="button"
          aria-label="Start map rotation"
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

export default React.memo(MapboxMapPublic, (prevProps, nextProps) => {
  return prevProps.className === nextProps.className;
});