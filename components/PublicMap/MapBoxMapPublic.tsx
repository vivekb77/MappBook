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

type MapEventListener = {
  type: string;
  listener: (e: any) => void;
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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const eventListenersRef = useRef<Array<{ type: string; listener: (e: any) => void }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const initialPositionRef = useRef<{ longitude: number; latitude: number } | null>(null);
  const targetZoomRef = useRef<number | null>(null);

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

      // Remove event listeners
      eventListenersRef.current.forEach(({ type, listener }) => {
        map.off(type, listener);
      });
      eventListenersRef.current = [];

      try {
        // Remove layers and sources
        const style = map.getStyle();
        style.layers?.forEach(layer => {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id);
          }
        });

        Object.keys(style.sources || {}).forEach(sourceId => {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        });

        // Remove map if still in DOM
        if (map.getContainer().parentNode) {
          map.remove();
        }
      } catch (e) {
        console.warn('Map cleanup error:', e);
      }

      mapInstanceRef.current = null;
    }
  };

  // Add cleanup to useEffect
  useEffect(() => {
    return cleanup;
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
    track('RED - Unable to load map on Public map', { error: errorMessage });
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
    if (currentMapStyle === newStyle) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    mapInstanceRef.current = map;
    const wasRotating = isRotating;

    try {
      // Save current viewport state
      const viewport = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };

      // Clean up existing event listeners
      eventListenersRef.current.forEach(({ type, listener }) => {
        map.off(type, listener);
      });
      eventListenersRef.current = [];

      // Set new style and wait for it to load
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Style load timeout'));
        }, 9000);

        const handleStyleLoad = () => {
          try {
            clearTimeout(timeoutId);

            // Add terrain source if it doesn't exist
            if (!map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14
              });
            }

            // Set terrain
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

            // Restore viewport
            map.setCenter(viewport.center);
            map.setZoom(viewport.zoom);
            map.setBearing(viewport.bearing);
            map.setPitch(viewport.pitch);

            setCurrentMapStyle(newStyle);

            if (wasRotating) {
              startRotation();
            }

            map.touchZoomRotate.disableRotation();

            resolve();
          } catch (err) {
            console.warn('Error in style load handler:', err);
            resolve(); // Resolve anyway to prevent hanging
          }
        };

        map.once('style.load', handleStyleLoad);
        eventListenersRef.current.push({
          type: 'style.load',
          listener: handleStyleLoad
        });

        // Set the new style
        map.setStyle(MAP_STYLES[newStyle]);
      });

      track('Map style switched on Public map');

    } catch (error) {
      console.warn('Style switch error:', error);
      setCurrentMapStyle(newStyle);

      // If style switch fails, try basic style application
      try {
        map.setStyle(MAP_STYLES[newStyle]);
      } catch (e) {
        console.warn('Fallback style switch failed:', e);
      }
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
      <div
        className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}
        role="alert"
      >
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Alert variant="destructive" className="w-96">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div
      className={`relative w-full h-full border-6 border-gray-900 rounded-lg overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive map"
    >
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="sr-only">Loading map</span>
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