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

// Helper function to calculate distance between points
const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const FlightAnimation: React.FC<FlightAnimationProps> = ({
  points,
  isAnimating,
  CONFIG,
  onAnimationStart,
  onAnimationCancel,
  onViewStateChange,
  onAnimationProgress
}) => {
  const animationFrameRef = useRef<number | null>(null);

  const calculateSegmentDurations = useCallback((points: Point[]): number[] => {
    const SPEED_KM_PER_SECOND = 0.125; // 0.125 km/s = 450 km/h
    const MIN_SEGMENT_DURATION = 3000; // Minimum 3 seconds per segment
    
    const durations: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const distance = calculateDistance(points[i], points[i + 1]);
      const duration = Math.max(MIN_SEGMENT_DURATION, distance / SPEED_KM_PER_SECOND * 1000);
      durations.push(duration);
    }
    return durations;
  }, []);

  const startDroneAnimation = useCallback(() => {
    if (points.length < 2) return;
    
    const INITIAL_ROTATION_DURATION = 8000; // 8 seconds for initial rotation
    const segmentDurations = calculateSegmentDurations(points);
    const totalFlightDuration = segmentDurations.reduce((sum, duration) => sum + duration, 0);
    
    onAnimationStart();
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation and zoom phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        const bearing = calculateVerticalBearing(points[0], points[1]);
        const initialZoom = CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 2);
        const targetZoom = CONFIG.map.drone.FLIGHT_ZOOM - (points[0].altitude * 2);
        
        onViewStateChange({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: initialZoom + (targetZoom - initialZoom) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: bearing * progress
        });
        
        onAnimationProgress(0);
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Flight phase
      const flightTime = elapsedTime - INITIAL_ROTATION_DURATION;
      let accumulatedTime = 0;
      let segmentIndex = 0;
      
      // Find current segment based on elapsed time
      for (let i = 0; i < segmentDurations.length; i++) {
        if (accumulatedTime + segmentDurations[i] > flightTime) {
          segmentIndex = i;
          break;
        }
        accumulatedTime += segmentDurations[i];
      }

      if (segmentIndex < points.length - 1) {
        const segmentProgress = (flightTime - accumulatedTime) / segmentDurations[segmentIndex];
        const startPoint = points[segmentIndex];
        const endPoint = points[segmentIndex + 1];
        
        // Interpolate between points
        const longitude = startPoint.longitude + 
          (endPoint.longitude - startPoint.longitude) * segmentProgress;
        const latitude = startPoint.latitude + 
          (endPoint.latitude - startPoint.latitude) * segmentProgress;
        const bearing = calculateVerticalBearing(startPoint, endPoint);
        
        const currentAltitude = interpolateAltitude(startPoint, endPoint, segmentProgress);
        const adjustedZoom = CONFIG.map.drone.FLIGHT_ZOOM - (currentAltitude * 2);

        onViewStateChange({
          longitude,
          latitude,
          bearing,
          zoom: adjustedZoom,
          pitch: CONFIG.map.drone.PITCH
        });

        const overallProgress = (accumulatedTime + (segmentDurations[segmentIndex] * segmentProgress)) / totalFlightDuration;
        onAnimationProgress(overallProgress);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        onAnimationCancel();
      }
    };

    // Start at first point
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