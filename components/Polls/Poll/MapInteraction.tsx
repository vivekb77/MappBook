// /MapInteraction.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaMinus, FaSyncAlt } from 'react-icons/fa';

interface MapInteractionProps {
  children: React.ReactNode;
  scale: number;
  translateX: number;
  translateY: number;
  onScaleChange: (scale: number) => void;
  onTranslateChange: (x: number, y: number) => void;
  onResetView: () => void;
}

const MapInteraction: React.FC<MapInteractionProps> = ({
  children,
  scale,
  translateX,
  translateY,
  onScaleChange,
  onTranslateChange,
  onResetView
}) => {
  // Refs for drag and touch interactions
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastX, setLastX] = useState<number>(0);
  const [lastY, setLastY] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  
  // Track multi-touch gestures
  const wasMultiTouchRef = useRef<boolean>(false);
  const touchStartTimeRef = useRef<number>(0);

  // Helper function to adjust sensitivity based on zoom level
  const getZoomAdaptiveSensitivity = (currentScale: number, isTouch: boolean = false): number => {
    // Base sensitivity higher for touch interactions
    const baseSensitivity = isTouch ? 1.2 : 1.0;

    // Scale sensitivity with zoom level
    if (currentScale > 2) {
      return baseSensitivity * 1.5;
    } else if (currentScale > 1) {
      return baseSensitivity * (1 + (currentScale - 1) * 0.5);
    }
    return baseSensitivity;
  };

  // Constrain translation to prevent map from going too far off-screen
  const constrainTranslation = (x: number, y: number): [number, number] => {
    // Maximum pan distance is relative to the current zoom
    const maxPanDistance = 1000 * scale;  // Adjust this value as needed

    return [
      Math.max(Math.min(x, maxPanDistance), -maxPanDistance),
      Math.max(Math.min(y, maxPanDistance), -maxPanDistance)
    ];
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY * -0.01;
    const newScale = Math.max(0.5, Math.min(5, scale + scaleChange));
    onScaleChange(newScale);
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button

    isDraggingRef.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;

    // Get mouse sensitivity adjusted for current zoom level
    const adaptiveMouseSensitivity = getZoomAdaptiveSensitivity(scale);

    // Calculate new position with adaptive sensitivity
    const newTranslateX = translateX + (dx / scale) * adaptiveMouseSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveMouseSensitivity;

    const [constrainedX, constrainedY] = constrainTranslation(newTranslateX, newTranslateY);

    onTranslateChange(constrainedX, constrainedY);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Record the touch start time
    touchStartTimeRef.current = Date.now();
    
    // Reset multi-touch flag at the beginning of each touch sequence
    wasMultiTouchRef.current = false;
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastX(e.touches[0].clientX);
      setLastY(e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      // Mark this as a multi-touch interaction
      wasMultiTouchRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If we detect more than one touch at any point, mark it as multi-touch
    if (e.touches.length > 1) {
      wasMultiTouchRef.current = true;
    }
    
    if (!isDragging || e.touches.length !== 1) return;

    // Calculate movement deltas
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;

    // Get touch sensitivity adjusted for current zoom level
    const adaptiveTouchSensitivity = getZoomAdaptiveSensitivity(scale, true);

    // Calculate new position with adaptive sensitivity
    const newTranslateX = translateX + (dx / scale) * adaptiveTouchSensitivity;
    const newTranslateY = translateY + (dy / scale) * adaptiveTouchSensitivity;

    const [constrainedX, constrainedY] = constrainTranslation(newTranslateX, newTranslateY);

    // Cancel any existing animation frame
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Use requestAnimationFrame for smoother updates
    animationRef.current = requestAnimationFrame(() => {
      onTranslateChange(constrainedX, constrainedY);
      animationRef.current = null;
    });

    setLastX(e.touches[0].clientX);
    setLastY(e.touches[0].clientY);
  };

  // Handle pinch-to-zoom on touch devices
  const handleTouchZoom = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    
    // Mark as multi-touch operation
    wasMultiTouchRef.current = true;

    // Get distance between two touches for pinch zoom
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    // If we don't have a previous distance yet, store this one
    if (lastTouchDistance === null) {
      setLastTouchDistance(currentDistance);
      return;
    }

    // Calculate zoom factor
    const factor = 0.01; // Adjust sensitivity here
    const delta = (currentDistance - lastTouchDistance) * factor;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));

    onScaleChange(newScale);
    setLastTouchDistance(currentDistance);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    setLastTouchDistance(null);
    
    // Calculate touch duration
    const touchDuration = Date.now() - touchStartTimeRef.current;
    
    // Keep the multi-touch flag active for a short period
    if (wasMultiTouchRef.current) {
      setTimeout(() => {
        wasMultiTouchRef.current = false;
      }, 300); // 300ms should be enough to prevent accidental taps
    }
  };

  // Zoom control functions
  const zoomIn = () => onScaleChange(Math.min(scale + 0.2, 5));
  const zoomOut = () => onScaleChange(Math.max(scale - 0.2, 0.5));

  // Add event listeners for mouse and touch events
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Add wheel event for zooming
      container.addEventListener('wheel', handleWheel, { passive: false });

      // Add global mouse events for dragging
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Add touch-action: none to element style directly
      container.style.touchAction = 'none';

      return () => {
        // Remove all listeners on cleanup
        container.removeEventListener('wheel', handleWheel);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [scale, translateX, translateY]); // Re-add listeners when these values change

  return (
    <div className="relative flex-1 h-full">
      {/* Map container with interaction handlers */}
      <div
        ref={containerRef}
        className="h-full w-full rounded-lg overflow-hidden bg-white shadow-md cursor-grab active:cursor-grabbing relative select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handleTouchZoom(e);
        }}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>

      {/* Zoom Control Buttons */}
      <div className="absolute right-2 bottom-10 bg-white bg-opacity-90 rounded-lg overflow-hidden shadow-md z-10">
        <button
          className="w-10 h-10 flex justify-center items-center border-none bg-transparent text-green-800 cursor-pointer text-base border-b border-gray-200 hover:bg-gray-100"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          <FaPlus />
        </button>
        <button
          className="w-10 h-10 flex justify-center items-center border-none bg-transparent text-green-800 cursor-pointer text-base border-b border-gray-200 hover:bg-gray-100"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          <FaMinus />
        </button>
      </div>
    </div>
  );
};

export default MapInteraction;