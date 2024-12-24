import React, { useEffect, useRef, useState } from "react";
import { Map, MapRef, ViewState, Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 10000,
      FLIGHT_DURATION: 20000,
      INITIAL_ZOOM: 2,
      FLIGHT_ZOOM: 19,
      PITCH: 80,
      POINT_RADIUS_KM: 0.5,
      REQUIRED_ZOOM: 12,
      MAX_POINTS: 10,
      MIN_ALTITUDE: 0.5,
      MAX_ALTITUDE: 1
    },
  }
};

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

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 0,
  zoom: CONFIG.map.drone.INITIAL_ZOOM,
  pitch: 0,
  bearing: 0,
};

// Timeline component for altitude control
const AltitudeTimeline: React.FC<{
  points: Point[];
  onAltitudeChange: (index: number, altitude: number) => void;
  isAnimating?: boolean;
  animationProgress?: number;
}> = ({ points, onAltitudeChange, isAnimating = false, animationProgress = 0 }) => {
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
const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const createCircleGeoJson = (center: Point, radiusKm: number) => {
  const points = 64;
  const coords = [];
  const km = radiusKm;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    // Approximate degrees for 1km at the equator
    const lat = center.latitude + (km / 111.32) * Math.cos(rad);
    const lng = center.longitude + (km / (111.32 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(rad);
    coords.push([lng, lat]);
  }
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  };
};

const createPathGeoJson = (points: Point[]) => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: points.map(p => [p.longitude, p.latitude])
  }
});
const calculateVerticalBearing = (startPoint: Point, endPoint: Point): number => {
  const dx = endPoint.longitude - startPoint.longitude;
  const dy = endPoint.latitude - startPoint.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Convert to clockwise bearing from north
  return (90 - angle + 360) % 360;
};


// Rest of the component remains similar, with altitude-related modifications
const MapboxMap: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [pathGeoJson, setPathGeoJson] = useState<any>(null);
  const [circleGeoJson, setCircleGeoJson] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleMapClick = (event: any) => {
    if (isAnimating) return;
    
    if (viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM) {
      setErrorMessage(`Please zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} or higher`);
      return;
    }

    if (points.length >= CONFIG.map.drone.MAX_POINTS) {
      setErrorMessage(`Maximum ${CONFIG.map.drone.MAX_POINTS} points allowed`);
      return;
    }
    
    const newPoint = {
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      altitude: CONFIG.map.drone.MIN_ALTITUDE,
      zoom: viewState.zoom,
      index: points.length + 1
    };

    if (points.length > 0) {
      const distance = calculateDistance(points[points.length - 1], newPoint);
      if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
        setErrorMessage(`New point must be within ${CONFIG.map.drone.POINT_RADIUS_KM}km of last point`);
        return;
      }
    }

    setPoints(prev => {
      const newPoints = [...prev, newPoint];
      setPathGeoJson(createPathGeoJson(newPoints));
      setCircleGeoJson(createCircleGeoJson(newPoint, CONFIG.map.drone.POINT_RADIUS_KM));
      setErrorMessage("");
      return newPoints;
    });
  };

  const handleAltitudeChange = (index: number, altitude: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { ...newPoints[index], altitude };
      setPathGeoJson(createPathGeoJson(newPoints));
      return newPoints;
    });
  };

  const resetPoints = () => {
    setPoints([]);
    setPathGeoJson(null);
    setCircleGeoJson(null);
    setErrorMessage("");
  };

  const startDroneAnimation = () => {
    if (points.length < 2) return;
    
    const SEGMENT_DURATION = 3000; // 3 seconds per segment
    const INITIAL_ROTATION_DURATION = 2000; // 2 seconds for initial rotation
    
    setIsAnimating(true);
    const startTime = Date.now();
    let currentSegment = 0;

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation and zoom phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        
        // Calculate bearing between first two points
        const bearing = calculateVerticalBearing(points[0], points[1]);
        
        setViewState({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: CONFIG.map.drone.INITIAL_ZOOM + (CONFIG.map.drone.FLIGHT_ZOOM - CONFIG.map.drone.INITIAL_ZOOM) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: bearing * progress
        });
        
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
        const longitude = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * segmentProgress;
        const latitude = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * segmentProgress;
        const bearing = calculateVerticalBearing(startPoint, endPoint);

        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          bearing,
          zoom: CONFIG.map.drone.FLIGHT_ZOOM,
          pitch: CONFIG.map.drone.PITCH
        }));

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - keep current view
        setIsAnimating(false);
        setPoints([]);
        setPathGeoJson(null);
        setCircleGeoJson(null);
      }
    };

    // Start at first point
    setViewState({
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: CONFIG.map.drone.INITIAL_ZOOM,
      pitch: 0,
      bearing: 0
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsAnimating(false);
    setPoints([]);
    setPathGeoJson(null);
    setCircleGeoJson(null);
    setErrorMessage("");
  };
  // ... (rest of the existing code remains the same)

  return (
    <div className="relative w-full h-full">
      {/* Existing map stats display */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded space-y-2 font-mono text-sm z-50">
        <div>Longitude: {viewState.longitude.toFixed(6)}°</div>
        <div>Latitude: {viewState.latitude.toFixed(6)}°</div>
        <div>Zoom: {viewState.zoom.toFixed(2)}</div>
        <div>Pitch: {viewState.pitch.toFixed(2)}°</div>
        <div>Bearing: {viewState.bearing.toFixed(2)}°</div>
      </div>

      {/* Main map component */}
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        projection="globe"
      >
        {/* Existing layers and markers */}
        {pathGeoJson && (
          <Source type="geojson" data={pathGeoJson}>
            <Layer
              id="path-layer"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {circleGeoJson && !isAnimating && (
          <Source type="geojson" data={circleGeoJson}>
            <Layer
              id="circle-layer"
              type="line"
              paint={{
                'line-color': '#ffff00',
                'line-width': 2,
                'line-opacity': 0.8,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {points.map((point) => (
          <Marker
            key={point.index}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
          >
            <div className="relative">
              <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.71573 0 0 6.71573 0 15C0 23.2843 15 42 15 42C15 42 30 23.2843 30 15C30 6.71573 23.2843 0 15 0Z" 
                      fill="#4285F4"/>
                <circle cx="15" cy="15" r="12" fill="white"/>
                <text 
                  x="15" 
                  y="20" 
                  textAnchor="middle" 
                  fill="#4285F4" 
                  fontSize="14" 
                  fontWeight="bold"
                  fontFamily="Arial"
                >
                  {point.index}
                </text>
              </svg>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Altitude Timeline */}
      {points.length > 0 && (
        <AltitudeTimeline 
          points={points}
          onAltitudeChange={handleAltitudeChange}
          isAnimating={isAnimating}
          animationProgress={animationProgress}
        />
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="flex flex-col items-end space-y-2">
          <div className="flex space-x-2">
            {points.length > 0 && !isAnimating && (
              <Button
                onClick={resetPoints}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Reset Points
              </Button>
            )}
            
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
          
          <div className="text-white bg-black/50 p-2 rounded text-right">
            {errorMessage ? (
              <span className="text-red-400">{errorMessage}</span>
            ) : (
              <>
                {viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM && 
                  `Zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} to start marking points`}
                {viewState.zoom >= CONFIG.map.drone.REQUIRED_ZOOM && (
                  <>
                    {points.length === 0 && 'Click to place first point'}
                    {points.length > 0 && !isAnimating && 
                      `Place point ${points.length + 1} within yellow circle (${points.length}/${CONFIG.map.drone.MAX_POINTS})`}
                    {isAnimating && 'In flight...'}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;