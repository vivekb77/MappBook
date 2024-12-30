import React from 'react';
import { Composition } from 'remotion';
import FlightAnimation from './FlightAnimation';
import type { ComponentType } from 'react';

export interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface FlightAnimationProps {
  points: Point[];
  mapboxToken: string;
  config: FlightConfig;
  aspectRatio?: AspectRatio;
  showLabels?: boolean;
}

export interface FlightConfig {
  rotationDuration: number;
  flightSpeedKmPerSecond: number;
  orbitSpeedFactor: number;
  flightZoom: number;
  initialZoom: number;
  pitch: number;
}

const ASPECT_RATIO_CONFIGS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  default: { width: 1920, height: 1080 }
} as const;

type AspectRatio = keyof typeof ASPECT_RATIO_CONFIGS;

const calculateDistance = (p1: Point, p2: Point): number => {
  const R = 6371;
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateTotalDistance = (points: Point[]): number => {
  return points.reduce((total, point, index) => {
    if (index === 0) return 0;
    return total + calculateDistance(points[index - 1], point);
  }, 0);
};

const FPS = 30;
const ORBIT_DURATION_BUFFER = 500;
const MIN_DURATION = 1000;


const FlightAnimationComponent = FlightAnimation as ComponentType<any>;

export const RemotionRoot: React.FC = () => {

  const defaultProps: FlightAnimationProps = {
    // points: [],
    points: [{"longitude":-97.12875642759997,"latitude":44.98371495408537,"zoom":10.747596086725022,"altitude":0,"index":1,"originalPosition":{"longitude":-97.12875642759997,"latitude":44.98371495408537}},{"longitude":-97.18153944103312,"latitude":44.98429377028762,"zoom":10.747596086725022,"altitude":1,"index":2,"originalPosition":{"longitude":-97.18153944103312,"latitude":44.98429377028762}},{"longitude":-97.20527133854578,"latitude":44.96547925227662,"zoom":10.747596086725022,"altitude":0,"index":3,"originalPosition":{"longitude":-97.20527133854578,"latitude":44.96547925227662}},{"longitude":-97.23595913705303,"latitude":44.93797000682201,"zoom":10.747596086725022,"altitude":0,"index":4,"originalPosition":{"longitude":-97.23595913705303,"latitude":44.93797000682201}}],
    mapboxToken: 'pk.eyJ1IjoibmV3c2V4cHJlc3NueiIsImEiOiJjbTU5Y3IwdXYzcXVwMmpxMzZ5czN4cWowIn0.p9lIC3ALRUwhwIIsw7W7vQ',
    config: {
      rotationDuration: 240,
      flightSpeedKmPerSecond: 0.185,
      orbitSpeedFactor: 0.25,
      flightZoom: 16,
      initialZoom: 2, // if set to 1 , map is zoomed at latitude 0
      pitch: 60
    },
    aspectRatio: '4:5',
    showLabels: true
  };

  const calculateDuration = React.useMemo(() => {
    const { points, config } = defaultProps;
    if (points.length < 2) return MIN_DURATION;

    const totalDistance = calculateTotalDistance(points);
    const flightDuration = (totalDistance / config.flightSpeedKmPerSecond) * FPS;
    const orbitDuration = flightDuration * config.orbitSpeedFactor;

    const totalDuration = Math.ceil(
      config.rotationDuration +
      flightDuration +
      orbitDuration +
      ORBIT_DURATION_BUFFER
    );

    return Math.max(totalDuration, MIN_DURATION);
  }, [defaultProps.points, defaultProps.config]);

  const dimensions = React.useMemo(() => {
    return ASPECT_RATIO_CONFIGS[defaultProps.aspectRatio || '4:5'];
  }, [defaultProps.aspectRatio]);

  return (
    <>
      <Composition
        id="FlightAnimation"
        component={FlightAnimationComponent}
        durationInFrames={calculateDuration}
        fps={FPS}
        width={dimensions.width}
        height={dimensions.height}
        defaultProps={defaultProps}
      />
    </>
  );
};