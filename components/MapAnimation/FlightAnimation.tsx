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

// Smoothly interpolate angles considering 360-degree wrapping
const interpolateAngle = (startAngle: number, endAngle: number, t: number): number => {
  // Normalize angles to 0-360 range
  startAngle = ((startAngle % 360) + 360) % 360;
  endAngle = ((endAngle % 360) + 360) % 360;

  // Find the shortest path
  let diff = endAngle - startAngle;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // Interpolate along the shortest path
  let result = startAngle + diff * t;
  return ((result % 360) + 360) % 360;
};

// Generate points for an orbital path
const generateOrbitPoints = (center: Point, radiusKm: number = 0.5, numPoints: number = 60): Point[] => {
  const orbitPoints: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 360) / numPoints;
    const rad = (angle * Math.PI) / 180;
    
    // Calculate offset from center point
    const latOffset = (radiusKm / 111.32) * Math.cos(rad);
    const lngOffset = (radiusKm / (111.32 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(rad);
    
    orbitPoints.push({
      longitude: center.longitude + lngOffset,
      latitude: center.latitude + latOffset,
      altitude: center.altitude,
      index: center.index
    });
  }
  return orbitPoints;
};
//numIntermediatePoints adjust it to make it more smooth 
const generateCurvedPath = (points: Point[], numIntermediatePoints: number = 100): Point[] => {
  if (points.length < 2) return points;

  const interpolatedPoints: Point[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    interpolatedPoints.push(start);
    
    for (let j = 1; j < numIntermediatePoints; j++) {
      const t = j / numIntermediatePoints;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      const control1 = i > 0 ? points[i - 1] : start;
      const control2 = i < points.length - 2 ? points[i + 2] : end;
      
      const lng = (2 * t3 - 3 * t2 + 1) * start.longitude +
        (t3 - 2 * t2 + t) * (end.longitude - control1.longitude) +
        (-2 * t3 + 3 * t2) * end.longitude +
        (t3 - t2) * (control2.longitude - start.longitude);
        
      const lat = (2 * t3 - 3 * t2 + 1) * start.latitude +
        (t3 - 2 * t2 + t) * (end.latitude - control1.latitude) +
        (-2 * t3 + 3 * t2) * end.latitude +
        (t3 - t2) * (control2.latitude - start.latitude);
        
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
  
  // Add orbital path around the final point
  const lastPoint = points[points.length - 1];
  const orbitPoints = generateOrbitPoints(lastPoint);
  interpolatedPoints.push(...orbitPoints);
  
  return interpolatedPoints;
};

const calculateBearing = (point1: Point, point2: Point): number => {
  const dx = point2.longitude - point1.longitude;
  const dy = point2.latitude - point1.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (90 - angle + 360) % 360;
};

const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371;
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
  const currentBearingRef = useRef<number>(0);

  const startDroneAnimation = useCallback(() => {
    if (points.length < 2) return;
    
    const INITIAL_ROTATION_DURATION = 8000;
    const SPEED_KM_PER_SECOND = 0.125;
    const ROTATION_SMOOTHNESS = 0.1; // Adjust this value to control rotation speed (0-1)
    
    const curvedPath = generateCurvedPath(points);
    let totalDistance = 0;
    
    for (let i = 0; i < curvedPath.length - 1; i++) {
      totalDistance += calculateDistance(curvedPath[i], curvedPath[i + 1]);
    }
    
    const totalFlightDuration = (totalDistance / SPEED_KM_PER_SECOND) * 1000;
    
    onAnimationStart();
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        const initialBearing = calculateBearing(curvedPath[0], curvedPath[1]);
        const initialZoom = CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 3);
        const targetZoom = CONFIG.map.drone.FLIGHT_ZOOM - (points[0].altitude * 3);
        
        // Smoothly interpolate initial rotation
        const currentBearing = interpolateAngle(0, initialBearing, progress);
        currentBearingRef.current = currentBearing;
        
        onViewStateChange({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: initialZoom + (targetZoom - initialZoom) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: currentBearing
        });
        
        onAnimationProgress(0);
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

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
        
        // Calculate position
        const longitude = currentPoint.longitude + 
          (nextPoint.longitude - currentPoint.longitude) * segmentProgress;
        const latitude = currentPoint.latitude + 
          (nextPoint.latitude - currentPoint.latitude) * segmentProgress;
        const altitude = currentPoint.altitude + 
          (nextPoint.altitude - currentPoint.altitude) * segmentProgress;
        
        // Calculate target bearing and smoothly interpolate
        const targetBearing = calculateBearing(currentPoint, nextPoint);
        const smoothBearing = interpolateAngle(
          currentBearingRef.current,
          targetBearing,
          ROTATION_SMOOTHNESS
        );
        currentBearingRef.current = smoothBearing;

        // Adjust zoom based on altitude
        const adjustedZoom = CONFIG.map.drone.FLIGHT_ZOOM - (altitude * 3);

        onViewStateChange({
          longitude,
          latitude,
          bearing: smoothBearing,
          zoom: adjustedZoom,
          pitch: CONFIG.map.drone.PITCH
        });

        onAnimationProgress(progress);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        onAnimationCancel();
      }
    };

    // Start at first point
    onViewStateChange({
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 3),
      pitch: 0,
      bearing: 0
    });
    currentBearingRef.current = 0;

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