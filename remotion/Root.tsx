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

export interface FlightConfig {
  rotationDuration: number;
  flightSpeedKmPerSecond: number;
  orbitSpeedFactor: number;
  flightZoom: number;
  initialZoom: number;
  pitch: number;
}

export interface FlightAnimationProps {
  points: Point[];
  mapboxToken: string;
  config: FlightConfig;
}

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

// Cast the FlightAnimation component to satisfy Remotion's type constraints
const FlightAnimationComponent = FlightAnimation as ComponentType<any>;

export const RemotionRoot: React.FC = () => {
  const defaultProps: FlightAnimationProps = {
    points: [{"longitude":174.1426688780395,"latitude":-39.3794835701303,"zoom":10.044567785360918,"altitude":0,"index":1},{"longitude":174.0973743238153,"latitude":-39.38360237980848,"zoom":10.044567785360918,"altitude":0,"index":2},{"longitude":174.06140511899235,"latitude":-39.359915905177836,"zoom":10.044567785360918,"altitude":0,"index":3},{"longitude":174.04475270935228,"latitude":-39.33055412738477,"zoom":10.044567785360918,"altitude":0,"index":4},{"longitude":174.016776661155,"latitude":-39.2965408703882,"zoom":10.044567785360918,"altitude":0,"index":5}],
    mapboxToken: process.env.REMOTION_MAPBOX_ACCESS_TOKEN || '',
    config: {
      rotationDuration: 240,
      flightSpeedKmPerSecond: 0.185,
      orbitSpeedFactor: 0.25,
      flightZoom: 11,
      initialZoom: 1,
      pitch: 60
    }
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

  React.useEffect(() => {
    if (!defaultProps.mapboxToken) {
      console.error('REMOTION_MAPBOX_ACCESS_TOKEN is not set in environment variables');
    }
  }, [defaultProps.mapboxToken]);

  return (
    <>
      <Composition
        id="FlightAnimation"
        component={FlightAnimationComponent}
        durationInFrames={calculateDuration}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};