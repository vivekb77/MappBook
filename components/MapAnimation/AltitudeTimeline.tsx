import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

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

export const AltitudeTimeline: React.FC<AltitudeTimelineProps> = ({
  points,
  onAltitudeChange,
  onPointRemove,
  isAnimating = false,
  animationProgress = 0
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);

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

  const handleDeletePoint = (index: number) => {
    if (isAnimating) return;
    onPointRemove(index);
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

  return (
    <div
      ref={timelineRef}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-4/5 h-32 bg-black/50 rounded-lg p-4"
      onMouseMove={handleMouseMove}
    >
      {/* Title text */}
      <div className="absolute -top-8 left-4 text-white text-sm font-medium">
        Hold & Drag points to set altitude
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
            const startX = (i / (points.length - 1)) * 100;
            const endX = ((i + 1) / (points.length - 1)) * 100;
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
        </svg>

        {/* Points */}
        {points.map((point, i) => {
          const x = (i / (points.length - 1)) * 100;
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
              {/* Point */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 -ml-2 -mt-2 rounded-full select-none ${isAnimating
                    ? 'bg-white/50 cursor-not-allowed'
                    : 'bg-white cursor-pointer hover:bg-blue-100'
                  }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent text selection
                  handleMouseDown(i)(e);
                }}
              >
                {/* Altitude value */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap select-none">
                  {point.altitude.toFixed(2)}
                </div>

                {/* Number in center */}
                <span className="text-[10px] font-bold text-gray-600 select-none">
                  {i + 1}
                </span>
              </div>

              {/* Delete button */}
              <button
                className={`absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 
                  ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                onClick={() => handleDeletePoint(i)}
                disabled={isAnimating}
                title={isAnimating ? "Cannot delete while animating" : "Delete point"}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Animation Progress Bar */}
      {isAnimating && points.length > 0 && (
        <>
          <div className="absolute bottom-0 inset-x-8 h-2 bg-black/30">
            <div
              className="absolute inset-y-0 left-0 bg-blue-500"
              style={{
                width: `${animationProgress * 100}%`
              }}
            />
          </div>
          <div className="absolute -bottom-6 left-8 text-white text-xs">
            {Math.round(animationProgress * 100)}%
          </div>
        </>
      )}
    </div>
  );
};

export default AltitudeTimeline;