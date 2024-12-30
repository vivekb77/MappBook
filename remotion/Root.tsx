import React from 'react';
import {Composition} from 'remotion';
import FlightAnimation from './FlightAnimation';

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

export const RemotionRoot: React.FC = () => {
  const defaultProps: FlightAnimationProps = {
    points: [
      {
        longitude: -107.44890865039108,
        latitude: 44.828362786095965,
        zoom: 12.299082968494874,
        altitude: 0,
        index: 1
      },
      {
        longitude: -107.49581154637008,
        latitude: 44.82509563869135,
        zoom: 12.299082968494874,
        altitude: 0.9140625,
        index: 2
      },
      {
        longitude: -107.5054433910801,
        latitude: 44.84568547299284,
        zoom: 12.299082968494874,
        altitude: 0,
        index: 3
      },
      {
        longitude: -107.48883194875394,
        latitude: 44.868444513102475,
        zoom: 12.299082968494874,
        altitude: 0.828125,
        index: 4
      }
    ],
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

  // Calculate total duration based on path length and config
  const calculateDuration = () => {
    const points = defaultProps.points;
    if (points.length < 2) return 1000;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const R = 6371; // Earth's radius in km
      const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
      const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    const flightDuration = (totalDistance / defaultProps.config.flightSpeedKmPerSecond) * 10; // multiply by fps
    const totalDuration = defaultProps.config.rotationDuration + flightDuration;
    
    return Math.ceil(totalDuration) + 500; // Add buffer for orbit phase
  };

  return (
    <>
      <Composition
        id="FlightAnimation"
        component={FlightAnimation}
        durationInFrames={calculateDuration()}
        fps={10}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};