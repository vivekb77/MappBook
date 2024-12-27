// Composition.tsx
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import React, {useMemo} from 'react';

type Point = {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

const MyComposition: React.FC<Record<string, unknown>> = (props) => {
  const frame = useCurrentFrame();
  
  const {
    points = [], 
    mapboxToken = '',
    transitionFrames = 60
  } = props as {
    points: Point[];
    mapboxToken: string;
    transitionFrames: number;
  };

  // Display static map if insufficient points
  if (points.length < 2) {
    return (
      <AbsoluteFill style={{backgroundColor: '#000'}}>
        <img
          src={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/0,0,2,0,0/1280x720?access_token=${mapboxToken}`}
          alt="Map"
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
    );
  }

  // Calculate total animation duration
  const totalTransitions = points.length - 1;
  const totalDuration = totalTransitions * transitionFrames;

  // Calculate progress (0 to 1) with improved interpolation
  const progress = interpolate(
    frame,
    [0, totalDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Find current point pair with smoother transitions
  const currentPointIndex = Math.min(
    Math.floor(progress * totalTransitions),
    totalTransitions - 1
  );

  // Calculate progress within current segment
  const segmentProgress = interpolate(
    frame % transitionFrames,
    [0, transitionFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const currentPoint = points[currentPointIndex];
  const nextPoint = points[currentPointIndex + 1];

  // Use easing for smoother transitions
  const easeProgress = useMemo(() => {
    return (t: number) => {
      return t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;
    };
  }, []);

  // Interpolate position with easing
  const longitude = interpolate(
    easeProgress(segmentProgress),
    [0, 1],
    [currentPoint.longitude, nextPoint.longitude]
  );

  const latitude = interpolate(
    easeProgress(segmentProgress),
    [0, 1],
    [currentPoint.latitude, nextPoint.latitude]
  );

  const altitude = interpolate(
    easeProgress(segmentProgress),
    [0, 1],
    [currentPoint.altitude, nextPoint.altitude]
  );

  // Calculate bearing with smoothing
  const bearing = Math.atan2(
    nextPoint.longitude - currentPoint.longitude,
    nextPoint.latitude - currentPoint.latitude
  ) * (180 / Math.PI);

  // Dynamic zoom based on distance between points
  const distance = Math.sqrt(
    Math.pow(nextPoint.longitude - currentPoint.longitude, 2) +
    Math.pow(nextPoint.latitude - currentPoint.latitude, 2)
  );

  const zoom = interpolate(
    distance,
    [0.001, 0.1],
    [19, 15],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Create path overlay with adjusted opacity
  const pathOverlay = `path-2+f44-0.3(${points
    .map(p => `${p.longitude},${p.latitude}`)
    .join(',')})`;

  // Create marker for current position
  const currentMarker = `pin-s+fff(${longitude},${latitude})`;

  // Construct Mapbox URL with optimizations
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${pathOverlay},${currentMarker}/${longitude},${latitude},${zoom},${bearing},60/1280x720@2x?access_token=${mapboxToken}`;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <img
        src={mapUrl}
        alt="Map"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </AbsoluteFill>
  );
};

export { MyComposition };