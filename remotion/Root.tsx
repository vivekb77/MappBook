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
    // points: [],
    points: [{"longitude":-93.6174027635334,"latitude":46.09365125181901,"zoom":10.346912853958845,"altitude":0.00,"index":1,"originalPosition":{"longitude":-93.6174027635334,"latitude":46.09365125181901}},{"longitude":-93.58878884885478,"latitude":46.13145273587273,"zoom":10.346912853958845,"altitude":0,"index":2,"originalPosition":{"longitude":-93.57745126002013,"latitude":46.10263613121563}},{"longitude":-93.53102113431578,"latitude":46.113865171666475,"zoom":10.346912853958845,"altitude":0.65625,"index":3,"originalPosition":{"longitude":-93.53102113431578,"latitude":46.113865171666475}},{"longitude":-93.4894499752545,"latitude":46.113116640137264,"zoom":10.346912853958845,"altitude":0,"index":4,"originalPosition":{"longitude":-93.4894499752545,"latitude":46.113116640137264}},{"longitude":-93.48675054934162,"latitude":46.15015674712444,"zoom":10.346912853958845,"altitude":0,"index":5,"originalPosition":{"longitude":-93.48675054934162,"latitude":46.15015674712444}},{"longitude":-93.45597709393279,"latitude":46.177827023156595,"zoom":10.346912853958845,"altitude":0,"index":6,"originalPosition":{"longitude":-93.45597709393279,"latitude":46.177827023156595}}],
    mapboxToken: 'pk.eyJ1IjoibmV3c2V4cHJlc3NueiIsImEiOiJjbTU5Y3IwdXYzcXVwMmpxMzZ5czN4cWowIn0.p9lIC3ALRUwhwIIsw7W7vQ',
    config: {
      rotationDuration: 240,
      flightSpeedKmPerSecond: 0.185,
      orbitSpeedFactor: 0.25,
      flightZoom: 16,
      initialZoom: 2, // if set to 1 , map is zoomed at latitude 0
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


  return (
    <>
      <Composition
        id="FlightAnimation"
        component={FlightAnimationComponent}
        durationInFrames={calculateDuration}
        // durationInFrames={2000}
        // fps={10}
        fps={FPS}
        width={1080}
        height={1350}
        defaultProps={defaultProps}
      />
    </>
  );
};