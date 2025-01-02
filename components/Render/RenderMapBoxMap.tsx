//rendermapboxmap.tsx
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Map, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FlightAnimation from './FlightAnimation';
import { nanoid } from 'nanoid';
import InfoPopUp from "./InfoPopUp";
import MapSettings from "./MapSettings";
import { useMapPoints } from './MapLayers';
import FullscreenButton from './FullscreenButton';

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 0,
      FLIGHT_DURATION: 0,
      INITIAL_ZOOM: 1,
      FLIGHT_ZOOM: 16,
      PITCH: 60,
      POINT_RADIUS_KM: 5,
      REQUIRED_ZOOM: 10,
      MAX_POINTS: 10,
      MIN_ALTITUDE: 0,
      MAX_ALTITUDE: 1,
      MAX_RETRY_ATTEMPTS: 2,
    },
    fog: {
      'horizon-blend': 0.4,          // More dramatic horizon blend
      'color': '#ffa07a',           // Light salmon color for sunset effect
      'high-color': '#4169e1',      // Royal blue for upper atmosphere
      'space-color': '#191970',     // Midnight blue for space
      'star-intensity': 0.85
    },
    light: {
      anchor: 'viewport',
      color: '#ffffff',
      intensity: 0.65,         // Brighter
      position: [1.5, 90, 80]  // High angle, shorter shadows
    }
  }
} as const;

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
  label?: string;
  originalPosition?: {
    longitude: number;
    latitude: number;
  };
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface CurvedPath {
  type: 'Feature';
  properties: {};
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface MapboxMapProps {
  initialPoints: Point[];
}

type MapStatus = {
  status: 'idle' | 'loading' | 'error' | 'ready';
  error?: string;
};

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: CONFIG.map.drone.INITIAL_ZOOM,
  pitch: 0,
  bearing: 0,
};

const MapboxMap: React.FC<MapboxMapProps> = ({ initialPoints }) => {


  // Refs
  const mapRef = useRef<MapRef>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isMountedRef = useRef(true);
  const retryAttemptsRef = useRef(0);
  const eventListenersRef = useRef<Array<{ type: string; listener: (e: any) => void }>>([]);
  const mapContainerId = useRef(`map-container-${nanoid()}`);

  // State
  const [mapStatus, setMapStatus] = useState<MapStatus>({ status: 'loading' });
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>(initialPoints);

  const [showMapBoxPlacesLabels, setShowMapBoxPlacesLabels] = useState(true);
  const [showFog, setShowFog] = useState(true);
  const [showPath, setShowPath] = useState(true);

  // Calculate flight path for visualization
  const generateCurvedPath = (points: Point[], numIntermediatePoints: number = 20): CurvedPath => {
    const flightPoints: [number, number][] = [];

    // Generate the curved flight path
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      flightPoints.push([start.longitude, start.latitude]);

      for (let j = 1; j < numIntermediatePoints; j++) {
        const t = j / numIntermediatePoints;
        const t2 = t * t;
        const t3 = t2 * t;

        const control1 = i > 0 ? points[i - 1] : start;
        const control2 = i < points.length - 2 ? points[i + 2] : end;

        const lng = (2 * t3 - 3 * t2 + 1) * start.longitude +
          (t3 - 2 * t2 + t) * (end.longitude - control1.longitude) +
          (-2 * t3 + 3 * t2) * end.longitude +
          (t3 - t2) * (control2.longitude - start.longitude);

        const lat = (2 * t3 - 3 * t2 + 1) * start.latitude +
          (t3 - 2 * t2 + t) * (end.latitude - control1.latitude) +
          (-2 * t3 + 3 * t2) * end.latitude +
          (t3 - t2) * (control2.latitude - start.latitude);

        flightPoints.push([lng, lat]);
      }
    }

    // Add the last point
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      flightPoints.push([lastPoint.longitude, lastPoint.latitude]);
    }

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: flightPoints
      }
    };
  };

  const showOrNotMapBoxPlacesLabels = useCallback((map: mapboxgl.Map) => {
    const style = map.getStyle();
    if (style && style.layers) {
      style.layers.forEach(layer => {
        if (layer.type === 'symbol') {
          try {
            map.setLayoutProperty(
              layer.id,
              'visibility',
              showMapBoxPlacesLabels ? 'visible' : 'none'
            );
          } catch (e) {
            console.warn(`Failed to set visibility for layer ${layer.id}:`, e);
          }
        }
      });
    }
  }, [showMapBoxPlacesLabels]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      showOrNotMapBoxPlacesLabels(mapInstanceRef.current);
    }
  }, [showMapBoxPlacesLabels, showOrNotMapBoxPlacesLabels]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      try {
        if (showFog) {
          map.setFog(CONFIG.map.fog);
        } else {
          map.setFog(null);
        }
      } catch (e) {
        console.warn('Error toggling fog:', e);
      }
    }
  }, [showFog]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      try {
        ['flight-path', 'flight-path-glow'].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(
              layerId,
              'visibility',
              showPath ? 'visible' : 'none'
            );
          }
        });
      } catch (e) {
        console.warn('Error toggling path visibility:', e);
      }
    }
  }, [showPath]);

  useMapPoints(mapInstanceRef.current, points, showMapBoxPlacesLabels);

  const cleanup = () => {
    if (!isMountedRef.current) return;

    // Clean up map instance
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      try {
        map.setTerrain(null);
        if (map.getSource('mapbox-dem')) {
          map.removeSource('mapbox-dem');
        }
      } catch (e) {
        console.warn('Error cleaning up terrain:', e);
      }

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

    setIsAnimating(false);
    if (isMountedRef.current) {
      setMapStatus({ status: 'idle' });
    }
  };


  const handleWebGLContextLoss = () => {
    if (!isMountedRef.current) return;

    retryAttemptsRef.current += 1;

    setMapStatus({
      status: 'error',
      error: retryAttemptsRef.current > CONFIG.map.drone.MAX_RETRY_ATTEMPTS
        ? "Unable to restore map after multiple attempts. Please refresh the page."
        : "WebGL context lost. Attempting to reload map..."
    });

    setTimeout(() => {
      if (isMountedRef.current) {
        cleanup();

        if (retryAttemptsRef.current <= CONFIG.map.drone.MAX_RETRY_ATTEMPTS) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setMapStatus({ status: 'loading' });
            }
          }, 1000);
        }
      }
    }, 100);
  };

  const handleMapError = () => {
    if (isMountedRef.current) {
      setMapStatus({
        status: 'error',
        error: "Unable to load map. Please refresh the page."
      });
    }
    setPersistentError("Unable to load map. Please refresh the page.");
    cleanup();
  };

  const handleMapLoad = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || !isMountedRef.current) return;

    const map = mapRef.current.getMap();
    if (!map || !map.getContainer()) return;

    mapInstanceRef.current = map;

    // Handle general map errors
    const errorHandler = () => {
      if (isMountedRef.current) {
        handleMapError();
      }
    };
    map.on('error', errorHandler);
    eventListenersRef.current.push({ type: 'error', listener: errorHandler });

    // Handle WebGL context loss
    const canvas = map.getCanvas();
    if (canvas) {
      const contextLossHandler = (e: Event) => {
        e.preventDefault();  // Prevent default handling
        handleWebGLContextLoss();
      };
      canvas.addEventListener('webglcontextlost', contextLossHandler);
      eventListenersRef.current.push({
        type: 'webglcontextlost',
        listener: contextLossHandler
      });

      // Optional: Handle context restoration
      const contextRestoredHandler = () => {
        if (isMountedRef.current) {
          setMapStatus({ status: 'loading' });
          map.resize();  // Force map redraw
        }
      };
      canvas.addEventListener('webglcontextrestored', contextRestoredHandler);
      eventListenersRef.current.push({
        type: 'webglcontextrestored',
        listener: contextRestoredHandler
      });
    }

    try {

      //1 show or not to show places names or road name or any names
      showOrNotMapBoxPlacesLabels(map);


      // 2 add terrain
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 17
      });

      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      if (isMountedRef.current) {
        setMapStatus({ status: 'ready' });
      }

      //3 add fog
      if (showFog) {
        map.setFog(CONFIG.map.fog);
      }

      //4 flight path
      if (points.length >= 2) {
        if (!map.getSource('flight-path')) {
          const curvedPath = generateCurvedPath(points);

          map.addSource('flight-path', {
            type: 'geojson',
            data: curvedPath
          });

          // Add path glow effect
          map.addLayer({
            id: 'flight-path-glow',
            type: 'line',
            source: 'flight-path',
            layout: {
              visibility: showPath ? 'visible' : 'none',
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#4a90e2',
              'line-width': 58,
              'line-opacity': 0.3,
              'line-blur': 3
            }
          });

          // Add main path line
          map.addLayer({
            id: 'flight-path',
            type: 'line',
            source: 'flight-path',
            layout: {
              visibility: showPath ? 'visible' : 'none',
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#0066ff',
              'line-width': 28,
              'line-opacity': 0.8
            }
          });
        }
      }


    } catch (e) {
      console.warn('Error initializing map:', e);
      handleMapError();
    }
  }, []);

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_ANIMATION_MAPBOX_ACCESS_TOKEN) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Mapbox access token is missing.
        </AlertDescription>
      </Alert>
    );
  }
  const mapControls = useMemo(() => (
    <div className="absolute bottom-48 right-2 space-y-2">
      <div className="flex flex-col items-end space-y-2">
        <div className="flex space-x-2">
          <FlightAnimation
            points={points}
            isAnimating={isAnimating}
            CONFIG={CONFIG}
            onAnimationStart={() => {
              setIsAnimating(true);
              setAnimationProgress(0);
            }}
            onAnimationCancel={() => {
              setIsAnimating(false);
              setAnimationProgress(0);
            }}
            onViewStateChange={setViewState}
            onAnimationProgress={setAnimationProgress}
          />
        </div>
      </div>
    </div>
  ), [points.length, isAnimating]);

  return (
    <div
      id={mapContainerId.current}
      className="relative w-full h-full"
    >
      {!isAnimating &&
        <>
          <FullscreenButton containerId={mapContainerId.current} />
        </>
      }
      {mapStatus.status === 'loading' && (
        <div className="h-screen-dynamic w-full flex items-center justify-center bg-gray-900">
          <div className="bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-gray-700" />
              <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-[3px] border-blue-500"
                style={{ animationDirection: 'reverse' }} />
            </div>
            <span className="text-lg font-medium text-gray-300">
              Loading 🌎
            </span>
          </div>
        </div>
      )}

      {/* Logo and Controls Container */}
      <div className={`absolute top-2 left-2 z-50 space-y-4 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        {/* MappBook Logo */}
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_ANIMATION_MAPBOX_ACCESS_TOKEN}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onError={handleMapError}
        reuseMaps={true}
        preserveDrawingBuffer={true}
        attributionControl={true}
        boxZoom={false}
        doubleClickZoom={false}
        dragRotate={true}
        keyboard={false}
        touchPitch={true}
        minZoom={1}
        maxZoom={20}
        renderWorldCopies={false}
        interactive={true}
      />

      {mapControls}
      {!isAnimating &&
        <>
          <InfoPopUp />
          <MapSettings
            showLabels={showMapBoxPlacesLabels}
            setShowLabels={setShowMapBoxPlacesLabels}
            showFog={showFog}
            setShowFog={setShowFog}
            showPath={showPath}
            setShowPath={setShowPath}
          />
        </>
      }
    </div>
  );
};

export default React.memo(MapboxMap);