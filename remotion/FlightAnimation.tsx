import React, { useMemo } from 'react';
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
import { Globe } from 'lucide-react';

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

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface FlightAnimationProps {
  points: Point[];
  mapboxToken: string;
  config: FlightConfig;
}

const interpolateAngle = (startAngle: number, endAngle: number, t: number): number => {
  startAngle = ((startAngle % 360) + 360) % 360;
  endAngle = ((endAngle % 360) + 360) % 360;
  let diff = endAngle - startAngle;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = startAngle + diff * t;
  return ((result % 360) + 360) % 360;
};

const calculateBearing = (point1: Point, point2: Point): number => {
  const dx = point2.longitude - point1.longitude;
  const dy = point2.latitude - point1.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (90 - angle + 360) % 360;
};

const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const generateOrbitPoints = (
  center: Point,
  currentBearing: number,
  radiusKm: number = 0.5,
  numPoints: number = 500,
  options: {
    adaptiveRadius?: boolean;
    smoothTransition?: boolean;
    startPoint?: Point;
  } = {}
): Point[] => {
  const orbitPoints: Point[] = [];
  const startBearing = currentBearing;
  
  const finalRadius = options.adaptiveRadius
    ? Math.max(0.1, radiusKm * (1 + center.altitude / 100))
    : radiusKm;
    
  let initialRadius = finalRadius;
  if (options.smoothTransition && options.startPoint) {
    const startDistance = calculateDistance(center, options.startPoint);
    initialRadius = startDistance;
  }

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const currentBearing = startBearing + (progress * 360);
    const angleRad = (90 - currentBearing) * (Math.PI / 180);
    
    const currentRadius = options.smoothTransition
      ? initialRadius + (finalRadius - initialRadius) * progress
      : finalRadius;
    
    const latOffset = (currentRadius / 111.32) * Math.sin(angleRad);
    const lngOffset = (currentRadius / (111.32 * Math.cos(center.latitude * Math.PI / 180))) * Math.cos(angleRad);
    
    const altitudeOffset = options.smoothTransition
      ? (center.altitude - (options.startPoint?.altitude || center.altitude)) * Math.sin(progress * Math.PI)
      : 0;
    
    orbitPoints.push({
      longitude: center.longitude + lngOffset,
      latitude: center.latitude + latOffset,
      altitude: center.altitude + altitudeOffset,
      index: center.index
    });
  }
  
  return orbitPoints;
};

const generateCurvedPath = (points: Point[], currentMapBearing: number, numIntermediatePoints: number = 500) => {
  if (points.length < 2) return { flightPath: points, orbitPath: [] };

  const flightPoints: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    flightPoints.push(start);
    
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
        
      const alt = start.altitude + (end.altitude - start.altitude) * t;
      
      flightPoints.push({
        longitude: lng,
        latitude: lat,
        altitude: alt,
        index: start.index
      });
    }
  }
  
  const finalFlightPoint = points[points.length - 1];
  flightPoints.push(finalFlightPoint);
  
  const lastFlightPoint = flightPoints[flightPoints.length - 1];
  const orbitPoints = generateOrbitPoints(
    finalFlightPoint,
    currentMapBearing,
    0.5,
    500,
    {
      adaptiveRadius: true,
      smoothTransition: true,
      startPoint: lastFlightPoint
    }
  );
  
  return {
    flightPath: flightPoints,
    orbitPath: orbitPoints
  };
};

const FlightAnimation: React.FC<FlightAnimationProps> = ({ points, mapboxToken, config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mapRef = React.useRef<MapRef>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [mapInstance, setMapInstance] = React.useState<mapboxgl.Map | null>(null);
  const loadingHandle = React.useRef<number | null>(null);

  const {
    totalDuration,
    flightPath,
    orbitPath,
    initialViewState,
    calculateViewState
  } = useMemo(() => {
    const initial = {
      longitude: points[0]?.longitude ?? 0,
      latitude: points[0]?.latitude ?? 0,
      zoom: config.initialZoom,
      pitch: 0,
      bearing: 0
    };

    const { flightPath, orbitPath } = generateCurvedPath(points, initial.bearing);
    
    let totalFlightDistance = 0;
    for (let i = 0; i < flightPath.length - 1; i++) {
      totalFlightDistance += calculateDistance(flightPath[i], flightPath[i + 1]);
    }

    let totalOrbitDistance = 0;
    for (let i = 0; i < orbitPath.length - 1; i++) {
      totalOrbitDistance += calculateDistance(orbitPath[i], orbitPath[i + 1]);
    }
    
    const ROTATION_SMOOTHNESS = 0.1;
    const flightDuration = (totalFlightDistance / config.flightSpeedKmPerSecond) * fps;
    const orbitDuration = (totalOrbitDistance / (config.flightSpeedKmPerSecond * config.orbitSpeedFactor)) * fps;
    const totalDuration = config.rotationDuration + flightDuration + orbitDuration;

    
    const calculateViewState = (frameIndex: number): ViewState => {
      console.log(`Calculating viewState for frame ${frameIndex}`);
      console.log(`Initial longitude ${initial.longitude}`);
      console.log(`Initial latitude ${initial.latitude}`);



      // Initial rotation phase
      if (frameIndex < config.rotationDuration) {
        const progress = frameIndex / config.rotationDuration;
        const initialBearing = calculateBearing(points[0], points[1]);
        
        return {
          longitude: initial.longitude,
          latitude: initial.latitude,
          zoom: interpolate(
            progress,
            [0, 1],
            [config.initialZoom, config.flightZoom]
          ),
          pitch: interpolate(progress, [0, 1], [0, config.pitch]),
          bearing: interpolateAngle(0, initialBearing, progress)
        };
      }
      


      
      // Flight phase
      const flightTime = frameIndex - config.rotationDuration;
      if (flightTime <= flightDuration) {
        const progress = flightTime / flightDuration;
        const pathIndex = Math.min(
          Math.floor(progress * (flightPath.length - 1)),
          flightPath.length - 2
        );
        
        const currentPoint = flightPath[pathIndex];
        const nextPoint = flightPath[pathIndex + 1];
        const segmentProgress = (progress * (flightPath.length - 1)) % 1;
        
        // Cache the previous bearing to ensure smooth transitions
        const prevViewState = frameIndex > 0 ? calculateViewState(frameIndex - 1) : null;
        const targetBearing = calculateBearing(currentPoint, nextPoint);
        const smoothBearing = prevViewState
          ? interpolateAngle(prevViewState.bearing, targetBearing, ROTATION_SMOOTHNESS)
          : targetBearing;
        
        return {
          longitude: currentPoint.longitude +
            (nextPoint.longitude - currentPoint.longitude) * segmentProgress,
          latitude: currentPoint.latitude +
            (nextPoint.latitude - currentPoint.latitude) * segmentProgress,
          zoom: config.flightZoom - (currentPoint.altitude * 3),
          pitch: config.pitch,
          bearing: smoothBearing
        };
      }
      
      // Orbit phase
      const orbitTime = flightTime - flightDuration;
      if (orbitTime <= orbitDuration) {
        const progress = orbitTime / orbitDuration;
        const pathIndex = Math.min(
          Math.floor(progress * (orbitPath.length - 1)),
          orbitPath.length - 2
        );
        
        const currentPoint = orbitPath[pathIndex];
        const nextPoint = orbitPath[pathIndex + 1];
        const segmentProgress = (progress * (orbitPath.length - 1)) % 1;
        
        // Ensure smooth transition from flight phase
        const prevViewState = frameIndex > 0 ? calculateViewState(frameIndex - 1) : null;
        const targetBearing = calculateBearing(currentPoint, nextPoint);
        const smoothBearing = prevViewState
          ? interpolateAngle(prevViewState.bearing, targetBearing, ROTATION_SMOOTHNESS * 0.5)
          : targetBearing;
        
        return {
          longitude: currentPoint.longitude +
            (nextPoint.longitude - currentPoint.longitude) * segmentProgress,
          latitude: currentPoint.latitude +
            (nextPoint.latitude - currentPoint.latitude) * segmentProgress,
          zoom: config.flightZoom - (currentPoint.altitude * 3),
          pitch: interpolate(
            progress,
            [0.8, 1],
            [config.pitch, 0]
          ),
          bearing: smoothBearing
        };
      }
      
      // Final state
      const finalPoint = points[points.length - 1];
      const prevViewState = frameIndex > 0 ? calculateViewState(frameIndex - 1) : null;
      
      



      return {
        longitude: finalPoint.longitude,
        latitude: finalPoint.latitude,
        zoom: config.flightZoom,
        pitch: 0,
        bearing: prevViewState?.bearing ?? 0
      };
      
    };


  

    return {
      totalDuration,
      flightPath,
      orbitPath,
      initialViewState: initial,
      calculateViewState
    };
  }, [points, config, fps]);

  const currentViewState = useMemo(() => 
    calculateViewState(frame),
    [frame, calculateViewState]
  );



  React.useEffect(() => {
    if (!mapRef.current || mapInstance) return;
    
    loadingHandle.current = delayRender("Loading map");
    
    const map = mapRef.current.getMap();
    setMapInstance(map);

    const preloadTiles = async () => {
      try {
        map.jumpTo(initialViewState);
        
        await new Promise<void>((resolve) => {
          const checkTiles = () => {
            if (map.areTilesLoaded()) {
              resolve();
            } else {
              setTimeout(checkTiles, 100);
            }
          };
          checkTiles();
        });

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
            type: 'line',  // There was a missing closing quote here
            source: 'flight-path',
            paint: {
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.7
            }
          });

          
        }

        setIsLoaded(true);
        if (loadingHandle.current) {
          continueRender(loadingHandle.current);
          loadingHandle.current = null;
        }
      } catch (error) {
        console.error('Map loading error:', error);
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
  }, [mapRef.current, points, config.flightZoom, initialViewState, flightPath]);

  React.useEffect(() => {
    if (!mapInstance || !isLoaded) return;
    
    // Use easeTo for smooth transitions
    mapInstance.easeTo({
      ...currentViewState,
      duration: 0,  // Set to 0 for frame-perfect updates
      animate: false // Disable animation to prevent interpolation
    });
  }, [currentViewState, mapInstance, isLoaded]);


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