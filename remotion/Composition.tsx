import React, { useMemo, useRef, useEffect } from 'react';
import { Map, MapRef } from "react-map-gl";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  useVideoConfig
} from 'remotion';
import "mapbox-gl/dist/mapbox-gl.css";

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface FlightAnimationProps {
  points: Point[];
  mapboxToken: string;
  config: {
    rotationDuration: number;
    flightSpeedKmPerSecond: number;
    orbitSpeedFactor: number;
    flightZoom: number;
    initialZoom: number;
    pitch: number;
  };
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
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

const generateCurvedPath = (points: Point[], numPoints: number = 500) => {
  if (points.length < 2) return { flightPath: points, orbitPath: [] };

  const flightPoints: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    for (let j = 0; j <= numPoints; j++) {
      const t = j / numPoints;
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
  
  return {
    flightPath: flightPoints,
    orbitPath: [] // Simplified for this example
  };
};

// Add path layer to visualize the route
const pathLayer = {
  id: 'flight-path',
  type: 'line',
  paint: {
    'line-color': '#ffffff',
    'line-width': 2,
    'line-opacity': 0.7
  }
};

export const FlightAnimation: React.FC<FlightAnimationProps> = ({
  points,
  mapboxToken,
  config
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mapRef = useRef<MapRef>(null);
  
  const {
    totalDuration,
    flightPath,
    initialViewState,
    currentViewState,
    pathCoordinates
  } = useMemo(() => {
    const path = generateCurvedPath(points);
    
    let totalFlightDistance = 0;
    for (let i = 0; i < path.flightPath.length - 1; i++) {
      totalFlightDistance += calculateDistance(path.flightPath[i], path.flightPath[i + 1]);
    }
    
    const flightDuration = (totalFlightDistance / config.flightSpeedKmPerSecond) * fps;
    
    const initial: ViewState = {
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: config.initialZoom,
      pitch: 0,
      bearing: 0
    };

    let current = { ...initial };
    
    // Calculate current view state based on frame
    if (frame < config.rotationDuration) {
      const progress = frame / config.rotationDuration;
      const initialBearing = calculateBearing(points[0], points[1]);
      
      current = {
        ...initial,
        zoom: interpolate(
          progress,
          [0, 1],
          [config.initialZoom, config.flightZoom - (points[0].altitude * 3)]
        ),
        pitch: interpolate(progress, [0, 1], [0, config.pitch]),
        bearing: interpolate(progress, [0, 1], [0, initialBearing])
      };
    } else {
      const flightProgress = (frame - config.rotationDuration) / flightDuration;
      const pathIndex = Math.min(
        Math.floor(flightProgress * (path.flightPath.length - 1)),
        path.flightPath.length - 2
      );
      
      const currentPoint = path.flightPath[pathIndex];
      const nextPoint = path.flightPath[pathIndex + 1];
      
      if (currentPoint && nextPoint) {
        const segmentProgress = (flightProgress * (path.flightPath.length - 1)) % 1;
        
        current = {
          longitude: interpolate(
            segmentProgress,
            [0, 1],
            [currentPoint.longitude, nextPoint.longitude]
          ),
          latitude: interpolate(
            segmentProgress,
            [0, 1],
            [currentPoint.latitude, nextPoint.latitude]
          ),
          zoom: config.flightZoom - (currentPoint.altitude * 3),
          pitch: config.pitch,
          bearing: calculateBearing(currentPoint, nextPoint)
        };
      }
    }

    // Create path coordinates for visualization
    const pathCoordinates = points.map(point => [point.longitude, point.latitude]);

    return {
      totalDuration: config.rotationDuration + flightDuration,
      flightPath: path.flightPath,
      initialViewState: initial,
      currentViewState: current,
      pathCoordinates
    };
  }, [frame, points, config, fps]);

  // Update map view state
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        ...currentViewState,
        duration: 0 // Instant updates for frame-perfect rendering
      });

      // Add path layer if not exists
      const map = mapRef.current.getMap();
      if (!map.getSource('flight-path')) {
        map.once('load', () => {
          map.addSource('flight-path', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: pathCoordinates
              }
            }
          });
          map.addLayer(pathLayer);
        });
      }
    }
  }, [currentViewState, pathCoordinates]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        projection="globe"
        fog={{
          'horizon-blend': 0.4,
          'color': '#ffa07a',
          'high-color': '#4169e1',
          'space-color': '#191970',
          'star-intensity': 0.85
        }}
        terrain={{
          source: 'mapbox-dem',
          exaggeration: 1.5
        }}
        attributionControl={false}
        reuseMaps={true}
        boxZoom={false}
        dragRotate={false}
        doubleClickZoom={false}
        keyboard={false}
        touchPitch={false}
        minZoom={1}
        maxZoom={20}
      />
    </AbsoluteFill>
  );
};