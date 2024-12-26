import React, { useEffect, useRef, useState } from "react";

// Add distance calculation function
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

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

const CONFIG = {
  map: {
    drone: {
      MIN_ALTITUDE: 0,
      MAX_ALTITUDE: 1
    },
  }
};

const INITIAL_ROTATION_DURATION = 8000; // 8 seconds for initial rotation
const SPEED_KM_PER_SECOND = 0.125; // 450 km/h = 0.125 km/s

interface AltitudeTimelineProps {
  points: Point[];
  onAltitudeChange: (index: number, altitude: number) => void;
  onPointRemove: (index: number) => void;
  isAnimating?: boolean;
  animationProgress?: number;
}

export const AltitudeTimeline: React.FC<AltitudeTimelineProps> = ({
  points,
  onAltitudeChange,
  onPointRemove,
  isAnimating = false,
  animationProgress = 0
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);

  // Calculate cumulative distances and total distance
  const calculateDistances = () => {
    const distances: number[] = [0];
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const segmentDistance = calculateDistance(points[i-1], points[i]);
      totalDistance += segmentDistance;
      distances.push(totalDistance);
    }
    
    return { distances, totalDistance };
  };

  // Calculate segment durations based on distances
  const calculateSegmentDurations = () => {
    const durations: number[] = [];
    const MIN_SEGMENT_DURATION = 3000; // Minimum 3 seconds per segment
    
    for (let i = 0; i < points.length - 1; i++) {
      const distance = calculateDistance(points[i], points[i + 1]);
      const duration = Math.max(MIN_SEGMENT_DURATION, distance / SPEED_KM_PER_SECOND * 1000);
      durations.push(duration);
    }
    
    return durations;
  };

  // Calculate actual progress considering initial rotation and distances
  const calculateActualProgress = () => {
    if (!isAnimating || points.length < 2) return 0;
    
    const { distances, totalDistance } = calculateDistances();
    const durations = calculateSegmentDurations();
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    
    // If we're still in initial rotation, return 0
    if (animationProgress * (totalDuration + INITIAL_ROTATION_DURATION) < INITIAL_ROTATION_DURATION) {
      return 0;
    }

    // Calculate progress based on time after initial rotation
    const timeAfterRotation = animationProgress * (totalDuration + INITIAL_ROTATION_DURATION) - INITIAL_ROTATION_DURATION;
    const flightProgress = timeAfterRotation / totalDuration;
    
    return Math.min(1, Math.max(0, flightProgress));
  };

  // Rest of the component functions remain the same...
  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    if (isAnimating) return;
    setDraggingPoint(index);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingPoint === null || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const height = rect.height;
    const y = e.clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(1, 1 - y / height));
    const altitude = CONFIG.map.drone.MIN_ALTITUDE +
      (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE) * normalizedY;

    onAltitudeChange(draggingPoint, altitude);
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  useEffect(() => {
    if (draggingPoint !== null && !isAnimating) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove as any);
    }
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [draggingPoint, isAnimating]);

  const actualProgress = calculateActualProgress();
  const { distances, totalDistance } = calculateDistances();

  return (
    <div
      ref={timelineRef}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-4/5 h-32 bg-black/50 rounded-lg p-4"
      onMouseMove={handleMouseMove}
    >
      {/* Title text with total distance */}
      <div className="absolute -top-8 left-4 text-white text-sm font-medium flex gap-4">
        <span>Hold & Drag points to set altitude</span>
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-px bg-white/20"
          />
        ))}
      </div>

      {/* Points and connecting lines */}
      <div className="relative h-full mx-8">
        <svg className="absolute inset-0 w-full h-full">
          {/* Connecting lines */}
          {points.slice(0, -1).map((point, i) => {
            const startX = (distances[i] / totalDistance) * 100;
            const endX = (distances[i + 1] / totalDistance) * 100;
            const startY = ((CONFIG.map.drone.MAX_ALTITUDE - point.altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
            const endY = ((CONFIG.map.drone.MAX_ALTITUDE - points[i + 1].altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;

            return (
              <line
                key={i}
                x1={`${startX}%`}
                y1={`${startY}%`}
                x2={`${endX}%`}
                y2={`${endY}%`}
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.5"
              />
            );
          })}

          {/* Animation Progress Line */}
          {isAnimating && points.length > 1 && actualProgress > 0 && (
            <>
              {points.slice(0, -1).map((point, i) => {
                const startX = (distances[i] / totalDistance) * 100;
                const endX = (distances[i + 1] / totalDistance) * 100;
                const startY = ((CONFIG.map.drone.MAX_ALTITUDE - point.altitude) /
                  (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
                const endY = ((CONFIG.map.drone.MAX_ALTITUDE - points[i + 1].altitude) /
                  (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
                
                const currentProgress = actualProgress * totalDistance;
                const segmentStart = distances[i];
                const segmentEnd = distances[i + 1];
                
                if (currentProgress <= segmentStart) return null;
                
                const segmentProgress = Math.min(1, 
                  (currentProgress - segmentStart) / (segmentEnd - segmentStart)
                );
                
                const actualEndX = startX + (endX - startX) * segmentProgress;
                const actualEndY = startY + (endY - startY) * segmentProgress;

                return (
                  <line
                    key={`progress-${i}`}
                    x1={`${startX}%`}
                    y1={`${startY}%`}
                    x2={`${actualEndX}%`}
                    y2={`${actualEndY}%`}
                    stroke="#3B82F6"
                    strokeWidth="4"
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* Points */}
        {points.map((point, i) => {
          const x = (distances[i] / totalDistance) * 100;
          const y = ((CONFIG.map.drone.MAX_ALTITUDE - point.altitude) /
            (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`
              }}
            >
              {/* Point with distance */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 -ml-2 -mt-2 rounded-full select-none ${
                  isAnimating ? 'bg-white/50 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-blue-100'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleMouseDown(i)(e);
                }}
              >
                {/* Distance and altitude values */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap select-none flex flex-col items-center">
                  <span>{point.altitude.toFixed(2)}</span>
                </div>

                <span className="text-[10px] font-bold text-gray-600 select-none">
                  {i + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AltitudeTimeline;