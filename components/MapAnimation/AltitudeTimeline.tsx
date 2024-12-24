import React, { useEffect, useRef, useState } from "react";

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
      MIN_ALTITUDE: 0.5,
      MAX_ALTITUDE: 1
    },
  }
};

interface AltitudeTimelineProps {
  points: Point[];
  onAltitudeChange: (index: number, altitude: number) => void;
  isAnimating?: boolean;
  animationProgress?: number;
}

export const AltitudeTimeline: React.FC<AltitudeTimelineProps> = ({ 
  points, 
  onAltitudeChange, 
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
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-4/5 h-32 bg-black/50 rounded-lg p-4"
      onMouseMove={handleMouseMove}
    >
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i}
            className="w-full h-px bg-white/20"
          />
        ))}
      </div>
      
      {/* Altitude markers */}
      <div className="absolute left-2 inset-y-4 flex flex-col justify-between text-white text-xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            {(CONFIG.map.drone.MAX_ALTITUDE - 
              (i * (CONFIG.map.drone.MAX_ALTITUDE - CONFIG.map.drone.MIN_ALTITUDE) / 5)
            ).toFixed(1)} km
          </div>
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
              className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full ${
                isAnimating 
                  ? 'bg-white/50 cursor-not-allowed' 
                  : 'bg-white cursor-pointer hover:bg-blue-100'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`
              }}
              onMouseDown={handleMouseDown(i)}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap">
                {point.altitude.toFixed(2)} km
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white text-xs">
                {point.index}
              </div>
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