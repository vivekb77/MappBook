// remotion/Root.tsx
import React from 'react';
import {Composition} from 'remotion';
import {MyComposition} from './Composition';

export const RemotionRoot: React.FC = () => {
  // Calculate duration based on expected points
  // Allow ~2 seconds (60 frames) per point transition
  const maxPoints = 10; // adjust based on your needs
  const framesPerTransition = 30;
  const totalDuration = maxPoints * framesPerTransition;

  return (
    <>
      <Composition
        id="Empty"
        component={MyComposition}
        durationInFrames={totalDuration}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          points: [],
          mapboxToken: '',
          transitionFrames: framesPerTransition,
        }}
      />
    </>
  );
};