import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Map, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MapMarkers from './MarkPoints';
import AltitudeTimeline from './AltitudeTimeline';
import FlightAnimation from './FlightAnimation';
// import ExportButton from "./Export";
import { Compass, Loader2 } from "lucide-react";
import InfoPopUp from "./InfoPopUp";
import { nanoid } from 'nanoid';
import { useUser } from '@clerk/nextjs';
import SignInButton from './SignInButton';
import { throttle } from 'lodash';
import { track } from "@vercel/analytics";

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 0,
      FLIGHT_DURATION: 0,
      INITIAL_ZOOM: 2,
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

// Helper function to calculate distance between points
const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371;
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

interface PointData {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
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
const MapboxMap: React.FC = () => {
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
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();

  // Utility functions and handlers
  const validatePoint = useCallback((newPoint: PointData): string | null => {
    if (isAnimating) {
      return "Cannot edit while flying";
    }

    if (viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM) {
      return `Zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} or higher`;
    }

    if (points.length >= CONFIG.map.drone.MAX_POINTS) {
      return `Maximum ${CONFIG.map.drone.MAX_POINTS} points allowed`;
    }

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const distance = calculateDistance(
        lastPoint,
        { ...newPoint, altitude: 0, index: 0 }
      );
      if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
        return `New point must be within ${CONFIG.map.drone.POINT_RADIUS_KM}km of last point`;
      }
    }

    return null;
  }, [isAnimating, points, viewState.zoom]);

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

  // Throttle handlers that trigger frequently
  const handleMapMove = useCallback(
    throttle((evt) => {
      setViewState(evt.viewState);
    }, 16), // ~60fps
    []
  );

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
    // Capture error state first
    const errorMessage = "Unable to load map. Please refresh the page.";
    
    // Track with useful error context
    track('RED - Drone - Map load failed', {
      timestamp: new Date().toISOString()
    });

    // Then update UI state
    if (isMountedRef.current) {
      setMapStatus({
        status: 'error',
        error: errorMessage
      });
    }
    setPersistentError(errorMessage);
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
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 17
      });
      map.touchZoomRotate?.enable();
      map.setFog(CONFIG.map.fog);

      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      if (isMountedRef.current) {
        setMapStatus({ status: 'ready' });
      }


    } catch (e) {
      console.warn('Error initializing map:', e);
      handleMapError();
    }
  }, []);

  // Event handlers
  const handleMapClick = (event: any) => {
    if (!isSignedIn) {
      setErrorMessage("Sign in to add points");
      return;
    }

    const { lng, lat } = event.lngLat;
    const pointData = {
      longitude: lng,
      latitude: lat,
      zoom: viewState.zoom
    };

    const error = validatePoint(pointData);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    handleAddPoint(pointData);
  };


  const handleAddPoint = (pointData: PointData) => {
    if (!isSignedIn) {
      setErrorMessage("Sign in to add points");
      return;
    }
  
    setPoints(prev => [...prev, {
      ...pointData,
      altitude: Math.random() * (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE) + CONFIG.map.drone.MIN_ALTITUDE, //random value between 0 to 1
      index: prev.length + 1,
      originalPosition: {
        longitude: pointData.longitude,
        latitude: pointData.latitude
      }
    }]);
  };

  const handlePointMove = useCallback((index: number, longitude: number, latitude: number) => {
    if (!isSignedIn) {
      setErrorMessage("Sign in to modify points");
      return;
    }

    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = {
        ...newPoints[index],
        longitude,
        latitude
      };
      return newPoints;
    });
  }, [isSignedIn]);

  const handleAltitudeChange = (index: number, altitude: number) => {
    if (!isSignedIn) return;

    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { ...newPoints[index], altitude };
      return newPoints;
    });
  };

  const handlePointRemove = (index: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints.splice(index, 1);
      return newPoints.map((point, i) => ({
        ...point,
        index: i + 1
      }));
    });
    setErrorMessage("");
  };

  const resetPoints = () => {
    setPoints([]);
    setErrorMessage("");
  };

  // Lifecycle
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER) {
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
        <button
          onClick={() => setViewState(prev => ({
            ...prev,
            pitch: 0,
            bearing: 0
          }))}
          className="bg-gray-800/90 hover:bg-gray-800 p-3 rounded-full shadow-lg transition-colors border border-gray-700"
          title="Look North"
        >
          <Compass className="w-6 h-6 text-blue-400" />
        </button>

        <div className="flex space-x-2">
          {points.length > 0 && !isAnimating && (
            <Button
              onClick={resetPoints}
              className="bg-red-500 text-gray-200 hover:bg-red-600 border border-red-400"
            >
              Clear Points
            </Button>
          )}

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
            skipInitialRotation={true}
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

      {!isSignedIn && mapStatus.status === 'ready' && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="w-48 pointer-events-auto">
            <SignInButton />
          </div>
        </div>
      )}

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

      {persistentError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{persistentError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* MappBook Logo */}
      <div className="absolute top-2 left-2 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      {/* Export Buttons */}
      {/* <ExportButton points={points} totalDistance={totalDistance} /> */}

      {/* Main map component */}
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
        {...viewState}
        onMove={!isAnimating ? evt => setViewState(evt.viewState) : undefined}
        onClick={!isAnimating ? handleMapClick : undefined}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onError={handleMapError}
        reuseMaps={true}
        preserveDrawingBuffer={true}
        attributionControl={true}
        boxZoom={false}
        doubleClickZoom={false}
        dragRotate={!isAnimating}
        keyboard={false}
        touchPitch={!isAnimating}
        interactive={!isAnimating}
        minZoom={1}
        maxZoom={20}
        renderWorldCopies={false}
      >
        {isSignedIn && (
          <MapMarkers
            points={points}
            isAnimating={isAnimating}
            viewState={viewState}
            CONFIG={CONFIG}
            onPointMove={handlePointMove}
            onError={setErrorMessage}
            onUpdatePointLabel={(index: number, label: string) => {
              if (!isSignedIn) return;
              const newPoints = [...points];
              newPoints[index] = { ...newPoints[index], label };
              setPoints(newPoints);
            }}
            onPointRemove={handlePointRemove}
            onDistanceChange={(total, distances) => {
              setTotalDistance(total)
            }}
          />
        )}
      </Map>
      <InfoPopUp />

      {/* Map UI Controls Group */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Map stats display */}
        {viewState.zoom <= 12 &&
          <div className="absolute top-28 right-2 bg-gray-800/90 text-gray-200 p-1 rounded space-y-2 font-mono text-xs md:text-sm z-50 border border-gray-700 pointer-events-auto">
            <div>Zoom: {viewState.zoom.toFixed(2)}</div>
            {/* <div>Pitch: {viewState.pitch.toFixed(2)}°</div>
          <div>Bearing: {viewState.bearing.toFixed(2)}°</div> */}
          </div>
        }

        {/* Status and Instructions */}
        {mapStatus.status === 'ready' && (
          <div className="absolute top-16 right-2 text-gray-200 bg-gray-800/90 p-1 rounded text-right border font-mono text-xs md:text-sm border-gray-700 pointer-events-auto">
            {errorMessage ? (
              <span className="text-red-400">{errorMessage}</span>
            ) : (
              <>
                {viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM &&
                  `Zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} to start marking points`}
                {viewState.zoom >= CONFIG.map.drone.REQUIRED_ZOOM && (
                  <>
                    {points.length === 0 && 'Click to place first point'}
                    {points.length > 0 && !isAnimating &&
                      `Place point ${points.length + 1} within yellow circle (${points.length}/${CONFIG.map.drone.MAX_POINTS})`}
                    {isAnimating && 'Flying'}
                  </>
                )}
              </>
            )}
          </div>
        )}

      </div>


      {/* Altitude Timeline */}
      {points.length > 0 && (
        <AltitudeTimeline
          points={points}
          onAltitudeChange={handleAltitudeChange}
          onPointRemove={handlePointRemove}
          isAnimating={isAnimating}
          animationProgress={animationProgress}
        />
      )}

      {/* Controls */}
      {mapControls}

    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(MapboxMap);