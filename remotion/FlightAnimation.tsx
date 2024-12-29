import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Map, MapRef } from "react-map-gl";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  useVideoConfig,
  delayRender,
  continueRender
} from 'remotion';
import "mapbox-gl/dist/mapbox-gl.css";

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface FlightConfig {
  rotationDuration: number;
  flightSpeedKmPerSecond: number;
  orbitSpeedFactor: number;
  flightZoom: number;
  initialZoom: number;
  pitch: number;
}

interface FlightAnimationProps {
  points: Point[];
  mapboxToken: string;
  config: FlightConfig;
}

const calculateBearing = (point1: Point, point2: Point): number => {
  const dx = point2.longitude - point1.longitude;
  const dy = point2.latitude - point1.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (90 - angle + 360) % 360;
};

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

const generateCurvedPath = (points: Point[], numPoints: number = 200) => {
  if (points.length < 2) return { flightPath: points, orbitPath: [] };

  const flightPoints: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    for (let j = 0; j <= numPoints; j++) {
      const t = j / numPoints;
      const lng = start.longitude + (end.longitude - start.longitude) * t;
      const lat = start.latitude + (end.latitude - start.latitude) * t;
      const alt = start.altitude + (end.altitude - start.altitude) * t;
      
      flightPoints.push({
        longitude: lng,
        latitude: lat,
        altitude: alt,
        index: start.index
      });
    }
  }
  
  return {
    flightPath: flightPoints,
    orbitPath: []
  };
};

// Change the component declaration to use React.FC with a generic type
const FlightAnimation: React.ComponentType<any> = ({ points, mapboxToken, config }: FlightAnimationProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mapRef = useRef<MapRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const loadingHandle = useRef<number | null>(null);
  const startTime = useRef(Date.now());
  
  const logTiming = (event: string) => {
    const elapsed = Date.now() - startTime.current;
    console.log(`[${elapsed}ms] ${event}`);
  };

  const {
    totalDuration,
    flightPath,
    initialViewState,
    viewStates
  } = useMemo(() => {
    logTiming('Starting view states calculation');
    
    const initial = {
      longitude: points[0]?.longitude ?? 0,
      latitude: points[0]?.latitude ?? 0,
      zoom: config.initialZoom,
      pitch: 0,
      bearing: 0
    };
    logTiming('Initial view state calculated');

    const path = generateCurvedPath(points);
    
    let totalFlightDistance = 0;
    for (let i = 0; i < path.flightPath.length - 1; i++) {
      totalFlightDistance += calculateDistance(path.flightPath[i], path.flightPath[i + 1]);
    }
    
    const flightDuration = (totalFlightDistance / config.flightSpeedKmPerSecond) * fps;
    const totalDuration = config.rotationDuration + flightDuration;
    
    logTiming(`Path generated. Total distance: ${totalFlightDistance.toFixed(2)}km, Duration: ${flightDuration} frames`);
    
    const frames = Array.from({ length: Math.ceil(totalDuration) });
    logTiming(`Calculating ${frames.length} view states`);
    
    const viewStates = frames.map((_, frameIndex) => {
      if (frameIndex < config.rotationDuration) {
        const progress = frameIndex / config.rotationDuration;
        const initialBearing = points[1] ? calculateBearing(points[0], points[1]) : 0;
        
        return {
          longitude: initial.longitude,
          latitude: initial.latitude,
          zoom: interpolate(
            progress,
            [0, 1],
            [config.initialZoom, config.flightZoom]
          ),
          pitch: interpolate(progress, [0, 1], [0, config.pitch]),
          bearing: interpolate(progress, [0, 1], [0, initialBearing])
        };
      } else {
        const flightProgress = (frameIndex - config.rotationDuration) / flightDuration;
        const pathIndex = Math.min(
          Math.floor(flightProgress * (path.flightPath.length - 1)),
          path.flightPath.length - 2
        );
        
        if (pathIndex >= 0 && path.flightPath[pathIndex] && path.flightPath[pathIndex + 1]) {
          const currentPoint = path.flightPath[pathIndex];
          const nextPoint = path.flightPath[pathIndex + 1];
          
          return {
            longitude: currentPoint.longitude,
            latitude: currentPoint.latitude,
            zoom: config.flightZoom,
            pitch: config.pitch,
            bearing: calculateBearing(currentPoint, nextPoint)
          };
        }
        
        return initial;
      }
    });
    
    logTiming('View states calculation complete');
    
    return {
      totalDuration,
      flightPath: path.flightPath,
      initialViewState: initial,
      viewStates
    };
  }, [points, config, fps]);

  useEffect(() => {
    if (!mapRef.current || mapInstance) return;
    
    logTiming('Starting map initialization');
    loadingHandle.current = delayRender("Loading map");
    
    const map = mapRef.current.getMap();
    setMapInstance(map);

    let loadedTiles = 0;
    map.on('sourcedata', (e) => {
      if (e.isSourceLoaded && e.source.type === 'raster') {
        loadedTiles++;
        logTiming(`Loaded tile ${loadedTiles}`);
      }
    });

    const preloadTiles = async () => {
      try {
        logTiming('Setting initial view');
        map.jumpTo(initialViewState);
        
        logTiming('Waiting for initial tiles');
        await new Promise<void>((resolve) => {
          const checkTiles = () => {
            if (map.areTilesLoaded()) {
              logTiming('Initial tiles loaded');
              resolve();
            } else {
              setTimeout(checkTiles, 100);
            }
          };
          checkTiles();
        });

        logTiming('Adding terrain source');
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': config.flightZoom + 1
          });
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }

        if (points.length >= 2) {
          logTiming('Adding flight path');
          map.addSource('flight-path', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: flightPath.map(p => [p.longitude, p.latitude])
              }
            }
          });

          map.addLayer({
            id: 'flight-path',
            type: 'line',
            source: 'flight-path',
            paint: {
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.7
            }
          });
        }

        logTiming('Map setup complete');
        setIsLoaded(true);
        if (loadingHandle.current) {
          continueRender(loadingHandle.current);
          loadingHandle.current = null;
        }
      } catch (error) {
        console.error('Map loading error:', error);
        logTiming(`Error during map setup: ${error}`);
        if (loadingHandle.current) {
          continueRender(loadingHandle.current);
          loadingHandle.current = null;
        }
      }
    };

    preloadTiles();

    return () => {
      if (loadingHandle.current) {
        continueRender(loadingHandle.current);
      }
    };
  }, [mapRef.current]);

  useEffect(() => {
    if (!mapInstance || !isLoaded) return;
    
    logTiming(`Rendering frame ${frame}`);
    const currentView = viewStates[frame];
    if (currentView) {
      const renderStart = Date.now();
      mapInstance.jumpTo({
        ...currentView,
      });
      logTiming(`Frame ${frame} render took ${Date.now() - renderStart}ms`);
    }
  }, [frame, mapInstance, isLoaded]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        fog={{
          'horizon-blend': 0.4,
          'color': '#ffa07a',
          'high-color': '#4169e1',
          'space-color': '#191970',
          'star-intensity': 0.85
        }}
        attributionControl={false}
        reuseMaps
        preserveDrawingBuffer
        renderWorldCopies={false}
        interactive={false}
        trackResize={false}
        maxZoom={config.flightZoom + 1}
        minZoom={config.initialZoom - 1}
        maxPitch={config.pitch + 10}
        minPitch={0}
        maxTileCacheSize={50}
        optimizeForTerrain={true}
        transformRequest={(url, resourceType) => {
          logTiming(`Resource request: ${resourceType} - ${url}`);
          return {
            url,
            headers: {
              'Accept': 'image/webp'
            }
          };
        }}
      />
    </AbsoluteFill>
  );
};

export default FlightAnimation;