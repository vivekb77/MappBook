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

const interpolateAngle = (startAngle: number, endAngle: number, t: number): number => {
  startAngle = ((startAngle % 360) + 360) % 360;
  endAngle = ((endAngle % 360) + 360) % 360;
  let diff = endAngle - startAngle;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = startAngle + diff * t;
  return ((result % 360) + 360) % 360;
};



const generateOrbitPoints = (
  center: Point, 
  currentBearing: number,
  radiusKm: number = 0.5,
  numPoints: number = 500,
  options: {
    adaptiveRadius?: boolean;
    smoothTransition?: boolean;
    startPoint?: Point;
  } = {}
): Point[] => {
  const orbitPoints: Point[] = [];
  const startBearing = currentBearing;
  
  // Calculate adaptive radius based on altitude if enabled
  const finalRadius = options.adaptiveRadius 
    ? Math.max(0.1, radiusKm * (1 + center.altitude / 100))
    : radiusKm;
    
  // If smooth transition is enabled and we have a start point,
  // adjust initial radius to match the distance from center
  let initialRadius = finalRadius;
  if (options.smoothTransition && options.startPoint) {
    const startDistance = calculateDistance(center, options.startPoint);
    initialRadius = startDistance;
  }

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const currentBearing = startBearing + (progress * 360);
    const angleRad = (90 - currentBearing) * (Math.PI / 180);
    
    // Interpolate radius from initial to final for smooth transition
    const currentRadius = options.smoothTransition 
      ? initialRadius + (finalRadius - initialRadius) * progress
      : finalRadius;
    
    const latOffset = (currentRadius / 111.32) * Math.sin(angleRad);
    const lngOffset = (currentRadius / (111.32 * Math.cos(center.latitude * Math.PI / 180))) * Math.cos(angleRad);
    
    // Optional: gradually adjust altitude during orbit
    const altitudeOffset = options.smoothTransition 
      ? (center.altitude - (options.startPoint?.altitude || center.altitude)) * Math.sin(progress * Math.PI)
      : 0;
    
    orbitPoints.push({
      longitude: center.longitude + lngOffset,
      latitude: center.latitude + latOffset,
      altitude: center.altitude + altitudeOffset,
      index: center.index
    });
  }
  
  return orbitPoints;
};



interface PathSegments {
  flightPath: Point[];
  orbitPath: Point[];
}

const generateCurvedPath = (points: Point[], currentMapBearing: number, numIntermediatePoints: number = 500): PathSegments => {
  if (points.length < 2) return { flightPath: points, orbitPath: [] };

  const flightPoints: Point[] = [];
  
  // Generate the curved flight path
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    
    flightPoints.push(start);
    
    for (let j = 1; j < numIntermediatePoints; j++) {
      const t = j / numIntermediatePoints;
      const t2 = t * t;
      const t3 = t2 * t;
      
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
      
      flightPoints.push({
        longitude: lng,
        latitude: lat,
        altitude: alt,
        index: start.index
      });
    }
  }
  
  // Add the final flight point
  const finalFlightPoint = points[points.length - 1];
  flightPoints.push(finalFlightPoint);
  
  // Generate orbital path with smooth transition
  const lastFlightPoint = flightPoints[flightPoints.length - 1];
  const orbitPoints = generateOrbitPoints(
    finalFlightPoint,
    currentMapBearing,
    0.5,
    500,
    {
      adaptiveRadius: true,
      smoothTransition: true,
      startPoint: lastFlightPoint
    }
  );
  
  return {
    flightPath: flightPoints,
    orbitPath: orbitPoints
  };
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
  const isOrbitingRef = useRef<boolean>(false);
  const resetPitchAnimationRef = useRef<number | null>(null);

  const resetPitchToZero = useCallback(() => {
    const RESET_DURATION = 1000; // 1 second duration
    const startTime = Date.now();
    const startPitch = CONFIG.map.drone.PITCH;

    const animateReset = () => {
      const currentTime = Date.now();
      const progress = Math.min((currentTime - startTime) / RESET_DURATION, 1);
      
      // Simple easing function
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const currentPitch = startPitch * (1 - easedProgress);

      onViewStateChange({
        longitude: points[points.length - 1].longitude,
        latitude: points[points.length - 1].latitude,
        zoom: CONFIG.map.drone.FLIGHT_ZOOM - (points[points.length - 1].altitude * 3),
        pitch: currentPitch,
        bearing: currentBearingRef.current
      });

      if (progress < 1) {
        resetPitchAnimationRef.current = requestAnimationFrame(animateReset);
      } else {
        resetPitchAnimationRef.current = null;
      }
    };

    resetPitchAnimationRef.current = requestAnimationFrame(animateReset);
  }, [points, CONFIG, onViewStateChange]);

  const startDroneAnimation = useCallback(() => {
    if (points.length < 2) return;
    
    const INITIAL_ROTATION_DURATION = 5000;
    const FLIGHT_SPEED_KM_PER_SECOND = 0.185;
    const ORBIT_SPEED_FACTOR = 0.25; 
    const ROTATION_SMOOTHNESS = 0.1; //smoothly start rotating from last point less= more smooth
    
    const { flightPath, orbitPath } = generateCurvedPath(points, currentBearingRef.current);

    // Calculate distances and durations
    let totalFlightDistance = 0;
    for (let i = 0; i < flightPath.length - 1; i++) {
      totalFlightDistance += calculateDistance(flightPath[i], flightPath[i + 1]);
    }
    
    let totalOrbitDistance = 0;
    for (let i = 0; i < orbitPath.length - 1; i++) {
      totalOrbitDistance += calculateDistance(orbitPath[i], orbitPath[i + 1]);
    }
    
    const flightDuration = (totalFlightDistance / FLIGHT_SPEED_KM_PER_SECOND) * 1000;
    const orbitDuration = (totalOrbitDistance / (FLIGHT_SPEED_KM_PER_SECOND * ORBIT_SPEED_FACTOR)) * 1000;


    
    onAnimationStart();
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        const initialBearing = calculateBearing(flightPath[0], flightPath[1]);
        const initialZoom = CONFIG.map.drone.INITIAL_ZOOM - (points[0].altitude * 3);
        const targetZoom = CONFIG.map.drone.FLIGHT_ZOOM - (points[0].altitude * 3);
        
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
      
      // Flight phase
      if (flightTime <= flightDuration) {
        isOrbitingRef.current = false;
        const progress = flightTime / flightDuration;
        const pathIndex = Math.min(
          Math.floor(progress * (flightPath.length - 1)), 
          flightPath.length - 2
        );
        
        const currentPoint = flightPath[pathIndex];
        const nextPoint = flightPath[pathIndex + 1];
        const segmentProgress = (progress * (flightPath.length - 1)) % 1;
        
        updateViewState(currentPoint, nextPoint, segmentProgress);
        onAnimationProgress(progress);
      } 
      // Orbit phase
      else if (flightTime <= flightDuration + orbitDuration) {
        isOrbitingRef.current = true;
        const orbitProgress = (flightTime - flightDuration) / orbitDuration;
        const pathIndex = Math.min(
          Math.floor(orbitProgress * (orbitPath.length - 1)), 
          orbitPath.length - 2
        );
        
        const currentPoint = orbitPath[pathIndex];
        const nextPoint = orbitPath[pathIndex + 1];
        const segmentProgress = (orbitProgress * (orbitPath.length - 1)) % 1;
        
        updateViewState(currentPoint, nextPoint, segmentProgress);
        onAnimationProgress(1); // Keep progress at 100% during orbit
      } 
      // Animation complete
      else {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        resetPitchToZero();
        onAnimationCancel();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const updateViewState = (currentPoint: Point, nextPoint: Point, segmentProgress: number) => {
      const longitude = currentPoint.longitude + 
        (nextPoint.longitude - currentPoint.longitude) * segmentProgress;
      const latitude = currentPoint.latitude + 
        (nextPoint.latitude - currentPoint.latitude) * segmentProgress;
      const altitude = currentPoint.altitude + 
        (nextPoint.altitude - currentPoint.altitude) * segmentProgress;
      
      const targetBearing = calculateBearing(currentPoint, nextPoint);
      const smoothBearing = interpolateAngle(
        currentBearingRef.current,
        targetBearing,
        isOrbitingRef.current ? ROTATION_SMOOTHNESS * 0.5 : ROTATION_SMOOTHNESS
      );
      currentBearingRef.current = smoothBearing;

      const adjustedZoom = CONFIG.map.drone.FLIGHT_ZOOM - (altitude * 3);

      onViewStateChange({
        longitude,
        latitude,
        bearing: smoothBearing,
        zoom: adjustedZoom,
        pitch: CONFIG.map.drone.PITCH
      });
    };

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
      animationFrameRef.current = null;
    }
    if (resetPitchAnimationRef.current) {
      cancelAnimationFrame(resetPitchAnimationRef.current);
      resetPitchAnimationRef.current = null;
    }
    resetPitchToZero();
    onAnimationCancel();
  }, [onAnimationCancel, resetPitchToZero]);

  return (
    <div className="flex space-x-2">
      {points.length >= 2 && !isAnimating && (
         <Button
         onClick={startDroneAnimation}
         className="bg-white text-black hover:bg-gray-100"
         data-testid="start-flight-button"
       >
         Start Flight
       </Button>
      )}

      {isAnimating && (
        <Button
          onClick={cancelAnimation}
          className="bg-red-500 text-white hover:bg-red-600"
          data-testid="cancel-flight-button"
        >
          Cancel Flight
        </Button>
      )}
    </div>
  );
};

export default FlightAnimation;