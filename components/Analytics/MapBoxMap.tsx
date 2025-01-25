import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Map, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Compass, Loader2 } from "lucide-react";
import { nanoid } from 'nanoid';
import { useUser } from '@clerk/nextjs';
import SignInButton from './SignInButton';
import PlotOrderBubbles from './PlotOrderBubbles';
import OrderFilters from './OrderFilters';
import PlotAllOrders from './PlotAllOrders';
import { throttle } from 'lodash';
import { track } from "@vercel/analytics";
import { useReportContext } from '@/context/ReportContext';

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v9",
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
      'horizon-blend': 0.4,
      'color': '#ffa07a',
      'high-color': '#4169e1',
      'space-color': '#191970',
      'star-intensity': 0.85
    },
    light: {
      anchor: 'viewport',
      color: '#ffffff',
      intensity: 0.65,
      position: [1.5, 90, 80]
    }
  }
} as const;

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
  const mapRef = useRef<MapRef>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isMountedRef = useRef(true);
  const retryAttemptsRef = useRef(0);
  const eventListenersRef = useRef<Array<{ type: string; listener: (e: any) => void }>>([]);
  const mapContainerId = useRef(`map-container-${nanoid()}`);
  const { reportData } = useReportContext();

  const [mapStatus, setMapStatus] = useState<MapStatus>({ status: 'loading' });
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [persistentError, setPersistentError] = useState<string | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();

  const cleanup = () => {
    if (!isMountedRef.current) return;

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
        const container = map.getContainer();
        const parent = container?.parentNode;

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

        try {
          map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
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

  const handleMapMove = useCallback(
    throttle((evt) => {
      setViewState(evt.viewState);
    }, 16),
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
    const errorMessage = "Unable to load map. Please refresh the page.";

    track('RED - Drone - Map load failed', {
      timestamp: new Date().toISOString()
    });

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

    const errorHandler = () => {
      if (isMountedRef.current) {
        handleMapError();
      }
    };
    map.on('error', errorHandler);
    eventListenersRef.current.push({ type: 'error', listener: errorHandler });

    const canvas = map.getCanvas();
    if (canvas) {
      const contextLossHandler = (e: Event) => {
        e.preventDefault();
        handleWebGLContextLoss();
      };
      canvas.addEventListener('webglcontextlost', contextLossHandler);
      eventListenersRef.current.push({
        type: 'webglcontextlost',
        listener: contextLossHandler
      });

      const contextRestoredHandler = () => {
        if (isMountedRef.current) {
          setMapStatus({ status: 'loading' });
          map.resize();
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

  useEffect(() => {
    console.log("Report Data:", reportData);
  }, [reportData]);

  return (
    <div
      id={mapContainerId.current}
      className="relative w-full h-full"
    >
      {/* {!isSignedIn && mapStatus.status === 'ready' && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="w-48 pointer-events-auto">
            <SignInButton />
          </div>
        </div>
      )} */}

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

      <div className="absolute top-2 left-2 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
        {...viewState}
        onMove={!isAnimating ? evt => setViewState(evt.viewState) : undefined}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onError={handleMapError}
        reuseMaps={true}
        preserveDrawingBuffer={true}
        attributionControl={true}
        boxZoom={false}
        doubleClickZoom={false}
        dragRotate={false}
        keyboard={false}
        touchPitch={false}
        interactive={true}
        minZoom={1}
        maxZoom={20}
        renderWorldCopies={false}
      >
        {mapStatus.status === 'ready' && (
          <>
            {showAllOrders ? (
              <PlotAllOrders orders={reportData?.orders || []} />
            ) : (
              <PlotOrderBubbles orders={reportData?.orders || []} />
            )}
            <OrderFilters />
          </>

        )}
      </Map>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 right-2 pointer-events-auto">
          <div
            className="relative h-[38px] rounded-full bg-gray-800/90 flex items-center w-64 cursor-pointer select-none border border-gray-700"
            onClick={() => setShowAllOrders(!showAllOrders)}
          >
            {/* Labels Container */}
            <div className="absolute inset-0 flex justify-between items-center z-10">
              <div className="flex-1 flex justify-center items-center gap-1.5">
                <span className={`text-sm font-medium transition-colors duration-150 ${!showAllOrders ? 'text-white' : 'text-gray-500'}`}>
                  By ZIP
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center gap-1.5">
                <span className={`text-sm font-medium transition-colors duration-150 ${showAllOrders ? 'text-white' : 'text-gray-500'}`}>
                  All Locations
                </span>
              </div>
            </div>

            {/* Sliding Background */}
            <div
              className={`
                absolute h-[34px] w-[49%] mx-[2px] rounded-full
                bg-blue-500
                transition-transform duration-150 ease-in-out
                ${showAllOrders ? 'translate-x-[100%]' : 'translate-x-0'}
              `}
            />
          </div>
        </div>



        {mapStatus.status === 'loading' && (
          <div className="absolute top-16 right-2 text-gray-200 bg-gray-800/90 p-1 rounded text-right border font-mono text-xs md:text-sm border-gray-700 pointer-events-auto">
            {errorMessage ? (
              <span className="text-red-400">{errorMessage}</span>
            ) : (
              <>
                {viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM &&
                  `Loading Map`}
                {viewState.zoom >= CONFIG.map.drone.REQUIRED_ZOOM && (
                  <>
                    {/* {points.length === 0 && 'Click to place first point'}
                    {points.length > 0 && !isAnimating &&
                      `Place point ${points.length + 1} within yellow circle (${points.length}/${CONFIG.map.drone.MAX_POINTS})`}
                    {isAnimating && 'Flying'} */}
                  </>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default React.memo(MapboxMap);