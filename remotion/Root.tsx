import React from 'react';
import {Composition} from 'remotion';
import FlightAnimation from './FlightAnimation';

export const RemotionRoot: React.FC = () => {
  const defaultProps: {
    points: Array<{
      longitude: number;
      latitude: number;
      altitude: number;
      index: number;
    }>;
    mapboxToken: string;
    config: {
      rotationDuration: number;
      flightSpeedKmPerSecond: number;
      orbitSpeedFactor: number;
      flightZoom: number;
      initialZoom: number;
      pitch: number;
    };
  } = {
    points: [],
    mapboxToken: process.env.REMOTION_MAPBOX_ACCESS_TOKEN || '',
    config: {
      rotationDuration: 240,
      flightSpeedKmPerSecond: 0.185,
      orbitSpeedFactor: 0.25,
      flightZoom: 16,
      initialZoom: 1,
      pitch: 60
    }
  };

  return (
    <>
     <Composition
        id="FlightAnimation"
        component={FlightAnimation}
        durationInFrames={500}
        fps={10}
        width={1280}
        height={720}
        defaultProps={defaultProps}
      />
    </>
  );
};