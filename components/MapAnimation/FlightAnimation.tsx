import React, { useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface FlightAnimationProps {
  points: Point[];
  isAnimating: boolean;
  CONFIG: {
    map: {
      drone: {
        INITIAL_ZOOM: number;
        FLIGHT_ZOOM: number;
        PITCH: number;
      };
    };
  };
  onAnimationStart: () => void;
  onAnimationCancel: () => void;
  onViewStateChange: (newViewState: MapViewState) => void;
  onAnimationProgress: (progress: number) => void;
}

const calculateVerticalBearing = (startPoint: Point, endPoint: Point): number => {
  const dx = endPoint.longitude - startPoint.longitude;
  const dy = endPoint.latitude - startPoint.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (90 - angle + 360) % 360;
};

// New function to interpolate altitude
const interpolateAltitude = (startPoint: Point, endPoint: Point, progress: number): number => {
  return startPoint.altitude + (endPoint.altitude - startPoint.altitude) * progress;
};

export const FlightAnimation: React.FC<FlightAnimationProps> = ({
  points,
  isAnimating,
  CONFIG,
  onAnimationStart,
  onAnimationCancel,
  onViewStateChange,
  onAnimationProgress
}) => {
  const animationFrameRef = useRef<number | null>(null);

  const startDroneAnimation = useCallback(() => {
    if (points.length < 2) return;
    
    const SEGMENT_DURATION = 8000; // 3 seconds per segment
    const INITIAL_ROTATION_DURATION = 8000; // 2 seconds for initial rotation
    
    onAnimationStart();
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation and zoom phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        
        // Calculate bearing between first two points
        const bearing = calculateVerticalBearing(points[0], points[1]);
        
        // Incorporate initial altitude
        const initialZoom = CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 2);
        const targetZoom = CONFIG.map.drone.FLIGHT_ZOOM - (points[0].altitude * 2);
        
        onViewStateChange({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: initialZoom + (targetZoom - initialZoom) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: bearing * progress
        });
        
        onAnimationProgress(progress / points.length);
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Flight phase
      const flightTime = elapsedTime - INITIAL_ROTATION_DURATION;
      const segmentIndex = Math.floor(flightTime / SEGMENT_DURATION);
      
      if (segmentIndex < points.length - 1) {
        const segmentProgress = (flightTime % SEGMENT_DURATION) / SEGMENT_DURATION;
        const startPoint = points[segmentIndex];
        const endPoint = points[segmentIndex + 1];
        
        // Interpolate between points
        const longitude = startPoint.longitude + 
          (endPoint.longitude - startPoint.longitude) * segmentProgress;
        const latitude = startPoint.latitude + 
          (endPoint.latitude - startPoint.latitude) * segmentProgress;
        const bearing = calculateVerticalBearing(startPoint, endPoint);
        
        // Interpolate altitude and adjust zoom with doubled effect
        const currentAltitude = interpolateAltitude(startPoint, endPoint, segmentProgress);
        const adjustedZoom = CONFIG.map.drone.FLIGHT_ZOOM - (currentAltitude * 2);

        onViewStateChange({
          longitude,
          latitude,
          bearing,
          zoom: adjustedZoom,
          pitch: CONFIG.map.drone.PITCH
        });

        onAnimationProgress((segmentIndex + segmentProgress + 1) / points.length);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        onAnimationCancel();
      }
    };

    // Start at first point with initial altitude adjustment
    onViewStateChange({
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 2),
      pitch: 0,
      bearing: 0
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [points, CONFIG, onAnimationStart, onViewStateChange, onAnimationProgress, onAnimationCancel]);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      onAnimationCancel();
    }
  }, [onAnimationCancel]);

  return (
    <div className="flex space-x-2">
      {points.length >= 2 && !isAnimating && (
        <Button
          onClick={startDroneAnimation}
          className="bg-white text-black hover:bg-gray-100"
        >
          Start Flight
        </Button>
      )}

      {isAnimating && (
        <Button
          onClick={cancelAnimation}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Cancel Flight
        </Button>
      )}
    </div>
  );
};

export default FlightAnimation;