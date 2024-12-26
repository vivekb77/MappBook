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

// Generate interpolated points for the curved path
const generateCurvedPath = (points: Point[], numIntermediatePoints: number = 20): Point[] => {
  if (points.length < 2) return points;

  const interpolatedPoints: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    // Add the start point
    interpolatedPoints.push(start);
    
    // Add intermediate points using cubic interpolation
    for (let j = 1; j < numIntermediatePoints; j++) {
      const t = j / numIntermediatePoints;
      
      // Cubic interpolation coefficients
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      // Control points for smoother curves
      const control1 = i > 0 ? points[i - 1] : start;
      const control2 = i < points.length - 2 ? points[i + 2] : end;
      
      // Calculate interpolated coordinates
      const lng = (2 * t3 - 3 * t2 + 1) * start.longitude +
        (t3 - 2 * t2 + t) * (end.longitude - control1.longitude) +
        (-2 * t3 + 3 * t2) * end.longitude +
        (t3 - t2) * (control2.longitude - start.longitude);
        
      const lat = (2 * t3 - 3 * t2 + 1) * start.latitude +
        (t3 - 2 * t2 + t) * (end.latitude - control1.latitude) +
        (-2 * t3 + 3 * t2) * end.latitude +
        (t3 - t2) * (control2.latitude - start.latitude);
        
      // Interpolate altitude linearly
      const alt = start.altitude + (end.altitude - start.altitude) * t;
      
      interpolatedPoints.push({
        longitude: lng,
        latitude: lat,
        altitude: alt,
        index: start.index
      });
    }
  }
  
  // Add the final point
  interpolatedPoints.push(points[points.length - 1]);
  
  return interpolatedPoints;
};

const calculateBearing = (point1: Point, point2: Point): number => {
  const dx = point2.longitude - point1.longitude;
  const dy = point2.latitude - point1.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (90 - angle + 360) % 360;
};

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

  const startDroneAnimation = useCallback(() => {
    if (points.length < 2) return;
    
    const INITIAL_ROTATION_DURATION = 8000; // 8 seconds for initial rotation
    const SPEED_KM_PER_SECOND = 0.125; // 450 km/h
    
    // Generate the curved path with interpolated points
    const curvedPath = generateCurvedPath(points);
    
    // Calculate total distance along the curved path
    let totalDistance = 0;
    for (let i = 0; i < curvedPath.length - 1; i++) {
      totalDistance += calculateDistance(curvedPath[i], curvedPath[i + 1]);
    }
    
    // Calculate total duration based on distance and speed
    const totalFlightDuration = (totalDistance / SPEED_KM_PER_SECOND) * 1000;
    
    onAnimationStart();
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation and zoom phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        const initialBearing = calculateBearing(curvedPath[0], curvedPath[1]);
        const initialZoom = CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 2);
        const targetZoom = CONFIG.map.drone.FLIGHT_ZOOM - (points[0].altitude * 2);
        
        onViewStateChange({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: initialZoom + (targetZoom - initialZoom) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: initialBearing * progress
        });
        
        onAnimationProgress(0);
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Flight phase
      const flightTime = elapsedTime - INITIAL_ROTATION_DURATION;
      if (flightTime <= totalFlightDuration) {
        const progress = flightTime / totalFlightDuration;
        const pathIndex = Math.min(
          Math.floor(progress * (curvedPath.length - 1)), 
          curvedPath.length - 2
        );
        
        const currentPoint = curvedPath[pathIndex];
        const nextPoint = curvedPath[pathIndex + 1];
        const segmentProgress = (progress * (curvedPath.length - 1)) % 1;
        
        // Interpolate position
        const longitude = currentPoint.longitude + 
          (nextPoint.longitude - currentPoint.longitude) * segmentProgress;
        const latitude = currentPoint.latitude + 
          (nextPoint.latitude - currentPoint.latitude) * segmentProgress;
        const altitude = currentPoint.altitude + 
          (nextPoint.altitude - currentPoint.altitude) * segmentProgress;
        
        // Calculate bearing based on current and next interpolated points
        const bearing = calculateBearing(currentPoint, nextPoint);
        
        // Adjust zoom based on altitude
        const adjustedZoom = CONFIG.map.drone.FLIGHT_ZOOM - (altitude * 2);

        onViewStateChange({
          longitude,
          latitude,
          bearing,
          zoom: adjustedZoom,
          pitch: CONFIG.map.drone.PITCH
        });

        onAnimationProgress(progress);
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