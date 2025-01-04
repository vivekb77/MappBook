import React, { useEffect, useRef, useState } from "react";

// Existing interfaces and constants remain the same
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

interface AltitudeTimelineProps {
  points: Point[];
  onAltitudeChange: (index: number, altitude: number) => void;
  onPointRemove: (index: number) => void;
  isAnimating?: boolean;
  animationProgress?: number;
}

const FLIGHT_SPEED_KM_PER_SECOND = 0.185;

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

export const AltitudeTimeline: React.FC<AltitudeTimelineProps> = ({
  points,
  onAltitudeChange,
  onPointRemove,
  isAnimating = false,
  animationProgress = 0
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);

  // Handle both mouse and touch events
  const handleMouseStart = (index: number) => (e: React.MouseEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    setDraggingPoint(index);
  };

  const handleTouchStart = (index: number) => (e: React.TouchEvent) => {
    if (isAnimating) return;
    // Don't preventDefault here - handle unwanted behavior via CSS
    setDraggingPoint(index);
  };

  const calculateNewAltitude = (clientY: number) => {
    if (!timelineRef.current) return null;
    const rect = timelineRef.current.getBoundingClientRect();
    const height = rect.height;
    const y = clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(1, 1 - y / height));
    return CONFIG.map.drone.MIN_ALTITUDE +
      (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE) * normalizedY;
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (draggingPoint === null) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const newAltitude = calculateNewAltitude(clientY);
    
    if (newAltitude !== null) {
      onAltitudeChange(draggingPoint, newAltitude);
    }
  };

  const handleDragEnd = () => {
    setDraggingPoint(null);
  };

  useEffect(() => {
    if (draggingPoint !== null && !isAnimating) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      document.addEventListener('touchcancel', handleDragEnd);
    }

    return () => {
      // Clean up all event listeners
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      document.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [draggingPoint, isAnimating]);

  const generateCurvedPath = (points: Point[], numIntermediatePoints: number = 500) => {
    if (points.length < 2) return points;

    const interpolatedPoints: Point[] = [];

    // Generate the curved flight path (excluding orbit)
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      interpolatedPoints.push(start);

      for (let j = 1; j < numIntermediatePoints && i < points.length - 2; j++) {
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

        interpolatedPoints.push({
          longitude: lng,
          latitude: lat,
          altitude: alt,
          index: start.index
        });
      }
    }

    // Add final point
    interpolatedPoints.push(points[points.length - 1]);
    return interpolatedPoints;
  };


  const calculateDistances = () => {
    const flightPath = generateCurvedPath(points, 0);
    const distances: number[] = [0];
    let totalDistance = 0;

    for (let i = 0; i < flightPath.length - 1; i++) {
      const segmentDistance = calculateDistance(flightPath[i], flightPath[i + 1]);
      totalDistance += segmentDistance;

      if (flightPath[i].index !== flightPath[i + 1].index) {
        distances.push(totalDistance);
      }
    }

    return { distances, totalDistance };
  };

  const calculateActualProgress = () => {
    if (!isAnimating || points.length < 2) return 0;

    const flightPath = generateCurvedPath(points, 0);
    let totalFlightDistance = 0;

    const lastPointIndex = points.length - 1;
    const flightOnlyPath = flightPath.filter(p => p.index < lastPointIndex);

    for (let i = 0; i < flightOnlyPath.length - 1; i++) {
      totalFlightDistance += calculateDistance(flightOnlyPath[i], flightOnlyPath[i + 1]);
    }

    return Math.min(1, Math.max(0, animationProgress));
  };

  const actualProgress = calculateActualProgress();
  const { distances, totalDistance } = calculateDistances();

  return (
    <div
      ref={timelineRef}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 md:w-4/5 w-[90%] h-32 bg-black/50 rounded-lg p-4 touch-none select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute -top-0 left-4 text-white text-xs font-extralight flex gap-4">
        <span>Drag circles up or down to control the drone's altitude during flight</span>
      </div>
      <div className="absolute bottom-0 left-4 text-white text-xs font-extralight">
      {/* Desktop instructions */}
      <div className="hidden md:block">
        <span>Ctrl + Mouse: 3D Map</span>
      </div>
      
      {/* Mobile instructions */}
      <div className="block md:hidden">
        <span>2 Fingers swipe up/down: 3D Map</span>
      </div>
    </div>

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
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Connecting lines */}
          {points.slice(0, -1).map((point, i) => {
            const startX = (distances[i] / totalDistance) * 100;
            const endX = (distances[i + 1] / totalDistance) * 100;
            const startY = ((CONFIG.map.drone.MAX_ALTITUDE - point.altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
            const endY = ((CONFIG.map.drone.MAX_ALTITUDE - points[i + 1].altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;

            // Calculate control points for the curve
            const midX = (startX + endX) / 2;
            const controlY = Math.min(startY, endY) - Math.abs(endX - startX) * 0.15;

            return (
              <path
                key={i}
                d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeOpacity="0.5"
              />
            );
          })}

          {/* Progress path and ball */}
          {isAnimating && points.length > 1 && actualProgress > 0 && (() => {
            // Find current segment
            let currentSegmentIndex = 0;
            let currentProgress = actualProgress * totalDistance;

            while (currentSegmentIndex < points.length - 1 &&
              distances[currentSegmentIndex + 1] < currentProgress) {
              currentSegmentIndex++;
            }

            const startX = (distances[currentSegmentIndex] / totalDistance) * 100;
            const endX = (distances[currentSegmentIndex + 1] / totalDistance) * 100;
            const startY = ((CONFIG.map.drone.MAX_ALTITUDE - points[currentSegmentIndex].altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
            const endY = ((CONFIG.map.drone.MAX_ALTITUDE - points[currentSegmentIndex + 1].altitude) /
              (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;

            const segmentProgress = (currentProgress - distances[currentSegmentIndex]) /
              (distances[currentSegmentIndex + 1] - distances[currentSegmentIndex]);

            const midX = (startX + endX) / 2;
            const controlY = Math.min(startY, endY) - Math.abs(endX - startX) * 0.15;

            // Calculate current position
            const t = segmentProgress;
            const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
            const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

            return (
              <>
                {/* Draw progress path */}
                {points.slice(0, currentSegmentIndex + 1).map((point, i) => {
                  if (i === points.length - 1) return null;

                  const segStartX = (distances[i] / totalDistance) * 100;
                  const segEndX = (distances[i + 1] / totalDistance) * 100;
                  const segStartY = ((CONFIG.map.drone.MAX_ALTITUDE - point.altitude) /
                    (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;
                  const segEndY = ((CONFIG.map.drone.MAX_ALTITUDE - points[i + 1].altitude) /
                    (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE)) * 100;

                  const segMidX = (segStartX + segEndX) / 2;
                  const segControlY = Math.min(segStartY, segEndY) - Math.abs(segEndX - segStartX) * 0.15;

                  const endPoint = i === currentSegmentIndex ?
                    `${currentX} ${currentY}` :
                    `${segEndX} ${segEndY}`;

                  return (
                    <path
                      key={`progress-${i}`}
                      d={`M ${segStartX} ${segStartY} Q ${segMidX} ${segControlY} ${endPoint}`}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="4"
                    />
                  );
                })}

                {/* Blue ball */}
                <circle
                  cx={currentX}
                  cy={currentY}
                  r="1"
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="1"
                >
                  {/* Optional: Add a subtle glow effect */}
                  <animate
                    attributeName="r"
                    values="2;2.5;2"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            );
          })()}
        </svg>

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
              <div
                className={`relative flex items-center justify-center w-8 h-8 -ml-2 -mt-4 rounded-full select-none ${
                  isAnimating ? 'bg-white/50 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-blue-100'
                }`}
                onMouseDown={handleMouseStart(i)}
                onTouchStart={handleTouchStart(i)}
              >

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