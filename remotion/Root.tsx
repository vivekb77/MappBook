// RemotionRoot.tsx
import React from 'react';
import {Composition} from 'remotion';


export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlightAnimation"

        durationInFrames={900} // Adjust based on flight duration
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          points: [],
          mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER || '',
          config: {
            rotationDuration: 240, // 8 seconds * 30fps
            flightSpeedKmPerSecond: 0.185,
            orbitSpeedFactor: 0.25,
            flightZoom: 16,
            initialZoom: 1,
            pitch: 60
          }
        }}
      />
    </>
  );
};